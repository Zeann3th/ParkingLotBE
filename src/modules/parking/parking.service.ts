import { HttpException, Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq, isNull } from 'drizzle-orm';
import { DRIZZLE } from 'src/database/drizzle.module';
import { parkingHistory, sections, slots, ticketPrices, tickets, vehicles } from 'src/database/schema';
import { DrizzleDB } from 'src/database/types/drizzle';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { TicketType, VehicleType } from 'src/database/types';

@Injectable()
export class ParkingService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) { }

  async checkIn(user: any, { sectionId, ticketId, plate, type }: CheckInDto) {
    if (user.role !== "ADMIN" && !user.allowedSections.includes(sectionId)) {
      throw new HttpException("You are not allowed to operate on this section", 403);
    }
    //TODO: Ticket valid ?

    // Find vehicle by plate
    const vehicle = await this.findOrCreateVehicle(plate, type);
    if (vehicle.slotId) {
      // Find slot by vehicle id (reserved)
      const [slot] = await this.db.select().from(slots)
        .where(and(
          eq(slots.id, vehicle.slotId),
          eq(slots.status, "FREE"),
        ));
      if (slot) {
        await this.assignVehicleToSlot(vehicle.id, slot.id, ticketId);
        return;
      }
    }
    // If null, find available slot
    const [{ slotId }] = await this.db.select({ slotId: slots.id }).from(slots)
      .leftJoin(vehicles, eq(slots.id, vehicles.slotId))
      .where(and(
        eq(slots.status, "FREE"),
        eq(slots.sectionId, sectionId),
        isNull(vehicles.slotId)
      ));
    if (slotId) {
      await this.assignVehicleToSlot(vehicle.id, slotId, ticketId);
      return;
    }
    // 4. If not found, check if there's capacity for a new slot in the section
    const [{ count: current, capacity }] = await this.db
      .select({ capacity: sections.capacity, count: count() })
      .from(sections)
      .where(eq(sections.id, sectionId));

    if (current < capacity) {
      const [{ slotId }] = await this.db.insert(slots).values({
        sectionId,
        status: "OCCUPIED",
      }).returning({ slotId: slots.id });
      await this.assignVehicleToSlot(vehicle.id, slotId, ticketId);
      return;
    }
    throw new HttpException("No available parking slots for this section", 400);
  }

  async checkOut({ ticketId }: CheckOutDto) {
    // Find by ticket id
    const [ticket] = await this.db.select().from(tickets)
      .where(eq(tickets.id, ticketId));

    // If not found, return error 
    if (!ticket) {
      throw new HttpException("Ticket not found", 404);
    }

    if (ticket.status !== "INUSE") {
      throw new HttpException("Ticket is not in use", 400);
    }

    let total = 0;

    // If found, update the slot, ticket to be available
    await this.db.transaction(async (tx) => {
      const [history] = await tx.select().from(parkingHistory)
        .where(eq(parkingHistory.ticketId, ticketId))
        .orderBy(desc(parkingHistory.checkedInAt))
        .limit(1);

      if (!history) {
        throw new HttpException("No parking history found for this ticket", 404);
      }

      const now = new Date().toISOString();

      // Update the history record
      const [updatedHistory] = await tx.update(parkingHistory)
        .set({ checkedOutAt: now })
        .where(eq(parkingHistory.id, history.id))
        .returning();

      // Update the ticket status
      const [updatedTicket] = await tx.update(tickets)
        .set({ status: "AVAILABLE" })
        .where(eq(tickets.id, ticketId))
        .returning();

      // Update the slot status
      await tx.update(slots)
        .set({ status: "FREE" })
        .where(eq(slots.id, history.slotId));

      // Get vehicle type
      const [vehicle] = await tx.select({ vehicleType: vehicles.type })
        .from(vehicles)
        .where(eq(vehicles.id, history.vehicleId));

      if (!vehicle) {
        throw new HttpException("Vehicle not found", 404);
      }

      // Calculate price
      total = await this.calculatePrice(
        updatedTicket.type,
        vehicle.vehicleType,
        history.checkedInAt,
        updatedHistory.checkedOutAt!
      );

      // Update fee in history
      await tx.update(parkingHistory)
        .set({ fee: total })
        .where(eq(parkingHistory.id, updatedHistory.id));
    });

    if (total === 0) {
      throw new HttpException("Failed to calculate price", 500);
    }

    return { total };
  }

  private async findOrCreateVehicle(plate: string, type: "CAR" | "MOTORBIKE") {
    let [vehicle] = await this.db.select().from(vehicles).where(eq(vehicles.plate, plate));
    if (!vehicle) {
      [vehicle] = await this.db.insert(vehicles)
        .values({ plate, type })
        .returning();
    }
    return vehicle;
  }

  private async assignVehicleToSlot(vehicleId: number, slotId: number, ticketId: number) {
    return this.db.transaction(async (tx) => {
      await Promise.all([
        tx.insert(parkingHistory).values({
          vehicleId,
          slotId,
          checkedInAt: new Date().toISOString(),
          ticketId,
        }),
        tx.update(slots).set({ status: "OCCUPIED" }).where(eq(slots.id, slotId)),
        tx.update(tickets).set({ status: "INUSE" }).where(eq(tickets.id, ticketId))
      ])
    });
  }

  private async calculatePrice(ticketType: TicketType, vehicleType: VehicleType, start: string, end: string) {
    //TODO: Need to check the valid date of ticket (monthly)
    const startDate = new Date(start);
    const endDate = new Date(end);

    const [{ basePrice }] = await this.db.select({ basePrice: ticketPrices.price }).from(ticketPrices)
      .where(and(
        eq(ticketPrices.type, ticketType),
        eq(ticketPrices.vehicleType, vehicleType)
      ));

    if (!basePrice) throw new Error('Price not found');

    if (ticketType === 'MONTHLY') {
      const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
        (endDate.getMonth() - startDate.getMonth());
      return Math.max(1, months) * basePrice;
    }

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
