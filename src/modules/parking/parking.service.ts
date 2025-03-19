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
    // 1. Find vehicle by plate
    const vehicle = await this.findOrCreateVehicle(plate, type);
    // 2. Find slot by vehicle id (reserved)
    const [slot] = await this.db.select().from(slots)
      .where(and(
        eq(slots.vehicleId, vehicle.id),
        eq(slots.sectionId, sectionId)
      ));
    if (slot) {
      await this.assignVehicleToSlot(vehicle.id, slot.id, ticketId);
      return;
    }
    // 3. If not found, find available slot
    const [availableSlot] = await this.db.select().from(slots)
      .where(and(
        eq(slots.status, "FREE"),
        eq(slots.sectionId, sectionId),
        isNull(slots.vehicleId)
      ));
    if (availableSlot) {
      await this.assignVehicleToSlot(vehicle.id, availableSlot.id, ticketId);
      return;
    }
    // 4. If not found, check if there's capacity for a new slot in the section
    const [{ count: slotCount, capacity }] = await this.db
      .select({ capacity: sections.capacity, count: count() })
      .from(sections)
      .where(eq(sections.id, sectionId));

    if (slotCount < capacity) {
      await this.assignVehicleToNewSlot(vehicle.id, sectionId, ticketId);
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
      const [[ticket], [history]] = await Promise.all([
        tx.update(tickets).set({ status: "AVAILABLE" })
          .where(eq(tickets.id, ticketId)).returning(),
        tx.update(parkingHistory).set({ checkedOutAt: new Date().toISOString() })
          .where(eq(parkingHistory.ticketId, ticketId))
          .orderBy(desc(parkingHistory.checkedInAt))
          .limit(1).returning()
      ]);
      const [_, [{ vehicleType }]] = await Promise.all([
        tx.update(slots).set({ status: "FREE" })
          .where(eq(slots.id, history.slotId)),
        tx.select({ vehicleType: vehicles.type }).from(vehicles)
          .where(eq(vehicles.id, history.vehicleId))
      ])

      total = await this.calculatePrice(ticket.type, vehicleType, history.checkedInAt, history.checkedOutAt!);
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

  private async assignVehicleToNewSlot(vehicleId: number, sectionId: number, ticketId: number) {
    return this.db.transaction(async (tx) => {
      const [newSlot] = await this.db
        .insert(slots)
        .values({
          sectionId,
          status: "OCCUPIED",
          vehicleId
        })
        .returning();
      await Promise.all([
        tx.insert(parkingHistory).values({
          vehicleId,
          slotId: newSlot.id,
          checkedInAt: new Date().toISOString(),
          ticketId,
        }),
        tx.update(slots).set({ status: "OCCUPIED" }).where(eq(slots.id, newSlot.id)),
        tx.update(tickets).set({ status: "INUSE" }).where(eq(tickets.id, ticketId))
      ])
    });
  }

  private async calculatePrice(ticketType: TicketType, vehicleType: VehicleType, start: string, end: string) {
    const startDate = new Date(start);
    const endDate = new Date(end);

    const [basePrice] = await this.db.select().from(ticketPrices)
      .where(and(
        eq(ticketPrices.type, ticketType),
        eq(ticketPrices.vehicleType, vehicleType)
      ));


    if (!basePrice) throw new Error('Price not found');

    if (ticketType === 'MONTHLY') {
      const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
        (endDate.getMonth() - startDate.getMonth());
      return basePrice.price * months;
    }

    const startHour = startDate.getHours();
    const endHour = endDate.getHours();
    let totalPrice = 0;

    const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    if (startHour < 18) {
      totalPrice += (18 - startHour) * (basePrice.price / 12);
      totalPrice += (24 - 18) * (basePrice.price / 12) * 1.5;
    } else {
      totalPrice += (24 - startHour) * (basePrice.price / 12) * 1.5;
    }

    for (let i = 1; i < totalDays; i++) {
      totalPrice += 12 * (basePrice.price / 12);
      totalPrice += 12 * (basePrice.price / 12) * 1.5;
    }

    if (endHour > 6) {
      totalPrice += 6 * (basePrice.price / 12) * 1.5;
      if (endHour > 18) {
        totalPrice += 12 * (basePrice.price / 12);
        totalPrice += (endHour - 18) * (basePrice.price / 12) * 1.5;
      } else {
        totalPrice += (endHour - 6) * (basePrice.price / 12);
      }
    } else {
      totalPrice += endHour * (basePrice.price / 12) * 1.5;
    }

    return totalPrice;
  }
}
