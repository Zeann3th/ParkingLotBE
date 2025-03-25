import { HttpException, Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq, gt, isNull, ne, notInArray } from 'drizzle-orm';
import { DRIZZLE } from 'src/database/drizzle.module';
import { history, sections, ticketPrices, tickets, userTickets, vehicleReservations, vehicles } from 'src/database/schema';
import { DrizzleDB } from 'src/database/types/drizzle';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { TicketType, VehicleType } from 'src/database/types';
import { UserInterface } from 'src/common/types';

@Injectable()
export class ParkingService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) { }

  async checkIn(user: UserInterface, { sectionId, ticketId, plate, type }: CheckInDto) {
    if (user.role !== "ADMIN" && !user.privileges?.includes(sectionId)) {
      throw new HttpException("You are not allowed to operate on this section", 403);
    }

    return await this.db.transaction(async (tx) => {
      const checkedInAt = (new Date()).toISOString();

      const [ticket] = await tx.select().from(tickets)
        .where(eq(tickets.id, ticketId));

      if (!ticket) {
        throw new HttpException("Ticket not found", 404);
      }

      if (ticket.status !== "AVAILABLE") {
        throw new HttpException("Ticket is not available", 400);
      }

      const vehicle = await this.findOrCreateVehicle(tx, plate, type);

      if (ticket.type !== "DAILY") {
        const [ticketDetails] = await tx
          .select().from(tickets)
          .innerJoin(userTickets, eq(tickets.id, userTickets.ticketId))
          .where(and(
            eq(tickets.id, ticketId),
            eq(userTickets.vehicleId, vehicle.id)
          ))

        if (!ticketDetails) {
          throw new HttpException("Invalid ticket", 400);
        }
      }

      if (ticket.type !== "RESERVED") {
        const { available } = await this.getNumberOfAvailableSlots(sectionId);
        if (available <= 0) {
          throw new HttpException("Section is full", 400);
        }
      }

      await tx.update(tickets)
        .set({ status: "INUSE" })
        .where(eq(tickets.id, ticketId));

      const [historyRecord] = await tx.insert(history)
        .values({
          vehicleId: vehicle.id,
          sectionId,
          ticketId,
          checkedInAt
        })
        .returning();

      return { history: historyRecord };
    });
  }

  async checkOut(user: UserInterface, { sectionId, ticketId, plate }: CheckOutDto) {
    if (user.role !== "ADMIN" && !user.privileges?.includes(sectionId)) {
      throw new HttpException("You are not allowed to operate on this section", 403);
    }

    const [ticket] = await this.db.select().from(tickets)
      .where(eq(tickets.id, ticketId));

    if (!ticket) {
      throw new HttpException("Ticket not found", 404);
    }

    if (ticket.status !== "INUSE") {
      throw new HttpException("Ticket is not in use", 400);
    }

    const [vehicle] = await this.db.select().from(vehicles)
      .where(eq(vehicles.plate, plate));

    if (!vehicle) {
      throw new HttpException("Vehicle not found", 404);
    }

    const [session] = await this.db.select().from(history)
      .where(and(
        eq(history.sectionId, sectionId),
        eq(history.ticketId, ticketId),
        eq(history.vehicleId, vehicle.id),
        isNull(history.checkedOutAt),
      ));

    if (!session) {
      throw new HttpException("Session not found", 404);
    }

    const startDate = new Date(session.checkedInAt);
    const endDate = new Date();
    let fee = 0;

    if (ticket.type === 'DAILY') {
      fee = await this.calculatePrice(vehicle.type, startDate.toISOString(), endDate.toISOString());
    }

    await this.db.transaction(async (tx) => {
      await tx.update(tickets).set({ status: "AVAILABLE" }).where(eq(tickets.id, ticketId));
      await tx.update(history).set({
        checkedOutAt: endDate.toISOString(),
        fee
      }).where(eq(history.id, session.id));
    });

    return { fee };
  }

  async getNumberOfAvailableSlots(sectionId: number) {
    try {
      const now = new Date().toISOString();

      const [{ capacity }] = await this.db.select({ capacity: sections.capacity })
        .from(sections)
        .where(eq(sections.id, sectionId));

      const reservedTickets = await this.db.select({ ticketId: vehicleReservations.ticketId })
        .from(vehicleReservations)
        .where(eq(vehicleReservations.sectionId, sectionId))

      const reservedCount = reservedTickets.length;
      const reservedTicketIds = reservedTickets.map(ticket => ticket.ticketId);

      const [{ occupiedCount }] = await this.db.select({ occupiedCount: count() })
        .from(history)
        .innerJoin(tickets, eq(history.ticketId, tickets.id))
        .where(and(
          eq(history.sectionId, sectionId),
          isNull(history.checkedOutAt),
          ne(tickets.type, 'RESERVED'),
          notInArray(tickets.id, reservedTicketIds)
        ));

      const available = capacity - reservedCount - occupiedCount;
      return { available, capacity };
    } catch (error) {
      throw new HttpException("Error getting available slots", 500);
    }
  }

  private async findOrCreateVehicle(tx: any, plate: string, type: string) {
    const [existingVehicle] = await tx.select()
      .from(vehicles)
      .where(eq(vehicles.plate, plate));

    if (existingVehicle) {
      return existingVehicle;
    }

    const [newVehicle] = await tx.insert(vehicles)
      .values({ plate, type })
      .returning();

    return newVehicle;
  }

  private async calculatePrice(vehicleType: VehicleType, start: string, end: string) {
    const startDate = new Date(start);
    const endDate = new Date(end);

    const [{ basePrice }] = await this.db.select({ basePrice: ticketPrices.price }).from(ticketPrices)
      .where(and(
        eq(ticketPrices.type, "DAILY"),
        eq(ticketPrices.vehicleType, vehicleType)
      ));

    if (!basePrice) throw new Error('Price not found');

    const hourlyRate = basePrice / 24;
    const dayRate = hourlyRate;
    const nightRate = hourlyRate * 1.5;

    let totalPrice = 0;
    const totalMs = endDate.getTime() - startDate.getTime();
    const totalHours = totalMs / (1000 * 60 * 60);

    let currentTime = new Date(startDate);

    while (currentTime < endDate) {
      const currentHour = currentTime.getHours();
      if (currentHour >= 6 && currentHour < 18) {
        totalPrice += dayRate;
      }
      else {
        totalPrice += nightRate;
      }

      currentTime.setHours(currentTime.getHours() + 1);

      if (currentTime > endDate) {
        const partialHour = 1 - (currentTime.getTime() - endDate.getTime()) / (1000 * 60 * 60);
        if (partialHour > 0) {
          if (currentHour >= 6 && currentHour < 18) {
            totalPrice -= dayRate;
            totalPrice += dayRate * partialHour;
          } else {
            totalPrice -= nightRate;
            totalPrice += nightRate * partialHour;
          }
        }
      }
    }

    const total = Math.round(totalPrice * 100) / 100;
    return total < basePrice ? basePrice : total;
  }
}
