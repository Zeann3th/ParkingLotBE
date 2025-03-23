import { HttpException, Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from 'src/database/drizzle.module';
import { DrizzleDB } from 'src/database/types/drizzle';
import { ticketPrices, tickets, users, userTickets, vehicleReservations, vehicles } from 'src/database/schema';
import { and, eq, gt } from 'drizzle-orm';
import { UpdateTicketDto, UpdateTicketPricingDto } from './dto/update-ticket.dto';
import { CreateDailyTicketDto, CreateTicketDto } from './dto/create-ticket.dto';
import { ReserveTicketDto } from './dto/reserve-ticket.dto';

@Injectable()
export class TicketService {

  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) { }

  async getAll() {
    const ticket = await this.db.select().from(tickets);
    return ticket;
  }

  async getById(id: number) {
    const [ticket] = await this.db.select().from(tickets).where(eq(tickets.id, id));
    return ticket;
  }

  async create(body: CreateTicketDto) {
    return await this.db.transaction(async (tx) => {
      const [{ ticketId }] = await tx.insert(tickets)
        .values({ type: body.type })
        .returning({ ticketId: tickets.id });

      if (body.type === "DAILY") {
        return { message: "Daily ticket created successfully", ticketId };
      }

      const [user] = await tx.select()
        .from(users)
        .where(eq(users.id, body.userId));
      if (!user) {
        throw new HttpException("User not found", 404);
      }

      const validTo = new Date();
      validTo.setMonth(validTo.getMonth() + (body.months ?? 1));

      const [userTicket] = await tx.insert(userTickets)
        .values({
          userId: body.userId,
          ticketId,
          validTo: validTo.toISOString(),
        })
        .returning();

      if (body.type === "MONTHLY") {
        return { message: "Monthly ticket created successfully", ticketId };
      }

      if (body.type === "RESERVED") {
        const [existingSlot] = await tx.select()
          .from(vehicleReservations)
          .where(and(
            eq(vehicleReservations.sectionId, body.sectionId),
            eq(vehicleReservations.slot, body.slot)
          ));
        if (existingSlot) {
          throw new HttpException(`Slot ${body.slot} is already reserved`, 409);
        }

        const [vehicle] = await tx.insert(vehicles)
          .values({ plate: body.plate, type: body.vehicleType })
          .onConflictDoNothing({ target: vehicles.plate })
          .returning();

        const vehicleId = vehicle?.id ||
          (await tx.select({ id: vehicles.id })
            .from(vehicles)
            .where(eq(vehicles.plate, body.plate))
            .then(rows => rows[0]?.id));
        if (!vehicleId) {
          throw new HttpException("Failed to create or find vehicle", 500);
        }

        await tx.insert(vehicleReservations)
          .values({
            ticketId,
            vehicleId,
            sectionId: body.sectionId,
            slot: body.slot,
          });
        return { message: "Reserved ticket created successfully", ticketId };
      }
    });
  }

  async createDailyTickets({ amount }: CreateDailyTicketDto) {
    const ticketsToCreate = Array.from({ length: amount }, () => ({
      type: 'DAILY' as const,
    }));

    await this.db.insert(tickets).values(ticketsToCreate);
    return { message: "Tickets created successfully" };
  }

  async update(id: number, { type, status, months }: UpdateTicketDto) {
    const [ticket] = await this.db.select().from(tickets).where(eq(tickets.id, id));
    if (!ticket) {
      throw new HttpException("Ticket not found", 404);
    }

    const [updatedTicket] = await this.db.update(tickets).set({
      ...(type && { type }),
      ...(status && { status }),
    }).where(eq(tickets.id, id)).returning();

    const res: any = { ...updatedTicket };

    if (updatedTicket.type !== "DAILY" && months) {
      const [userTicket] = await this.db.select().from(userTickets).where(eq(userTickets.ticketId, id));
      if (!userTicket) {
        throw new HttpException("User ticket not found", 404);
      }

      let validTo = userTicket.validTo ? new Date(userTicket.validTo) : new Date();
      validTo.setMonth(validTo.getMonth() + months);

      await this.db.update(userTickets).set({ validTo: validTo.toISOString() }).where(eq(userTickets.ticketId, id));
      res.validTo = validTo.toISOString();
    }
    return res;
  }

  async reserve(id: number, body: ReserveTicketDto) {
    return await this.db.transaction(async (tx) => {
      const [ticket] = await tx.select().from(tickets).where(eq(tickets.id, id));
      if (!ticket) {
        throw new HttpException("Ticket not found", 404);
      }
      if (ticket.type !== "RESERVED") {
        throw new HttpException("Ticket is not of type RESERVED", 400);
      }

      const [{ vehicleId }] = await tx.insert(vehicles)
        .values({ plate: body.plate, type: body.vehicleType })
        .onConflictDoNothing({ target: vehicles.plate })
        .returning({ vehicleId: vehicles.id });

      if (!vehicleId) {
        throw new HttpException("Failed to create or find vehicle", 500);
      }

      const [existingSlot] = await tx.select()
        .from(vehicleReservations)
        .leftJoin(userTickets, eq(vehicleReservations.ticketId, userTickets.ticketId))
        .where(and(
          eq(vehicleReservations.sectionId, body.sectionId),
          eq(vehicleReservations.slot, body.slot),
        ));
      if (existingSlot) {
        throw new HttpException(`Slot ${body.slot} is already reserved`, 409);
      }

      await tx.insert(vehicleReservations)
        .values({
          ticketId: id,
          vehicleId,
          sectionId: body.sectionId,
          slot: body.slot,
        });

      return { message: "Ticket reserved successfully" };
    });
  }

  //TODO: Handle ticket lost

  async getPricing() {
    return await this.db.select().from(ticketPrices);
  }

  async updatePricing({ type, price, vehicleType }: UpdateTicketPricingDto) {
    const [res] = await this.db.update(ticketPrices).set({ price: Number(price) })
      .where(and(
        eq(ticketPrices.type, type),
        eq(ticketPrices.vehicleType, vehicleType)
      )).returning();
    return res;
  }

  async delete(id: number) {
    await this.db.delete(tickets).where(eq(tickets.id, id));
    return {}
  }
}
