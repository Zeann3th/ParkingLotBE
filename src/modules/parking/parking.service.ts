import { HttpException, Inject, Injectable } from '@nestjs/common';
import { count, eq } from 'drizzle-orm';
import { DRIZZLE } from 'src/database/drizzle.module';
import { parkingHistory, sections, slots, tickets, vehicles } from 'src/database/schema';
import { DrizzleDB } from 'src/database/types/drizzle';
import { CheckInDto } from './dto/check-in.dto';

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
    const [slot] = await this.db.select()
      .from(slots)
      .where(eq(slots.vehicleId, vehicle.id));
    if (slot) {
      await this.assignVehicleToSlot(vehicle.id, slot.id, ticketId);
      return;
    }
    // 3. If not found, find available slot
    const [availableSlot] = await this.db.select()
      .from(slots)
      .where(eq(slots.status, "FREE"));
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

  async checkOut() {
    // Find by ticket id
    // If not found, return error 
    // If found, update the slot to be available, ticket to be available
    // calculate the price and return it
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
}
