import { HttpException, Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from 'src/database/drizzle.module';
import { DrizzleDB } from 'src/database/types/drizzle';
import { ticketPrices, tickets, users, userTickets, vehicleReservations, vehicles } from 'src/database/schema';
import { and, eq } from 'drizzle-orm';
import { UpdateTicketDto, UpdateTicketPricingDto } from './dto/update-ticket.dto';
import { CreateMonthlyTicketDto, CreateReservedTicketDto } from './dto/create-ticket.dto';

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

  async createDailyTickets({ amount }: { amount: number }) {
    const ticketsToCreate = Array.from({ length: amount }, () => ({
      type: 'DAILY' as const,
      status: 'AVAILABLE' as const,
    }));

    await this.db.insert(tickets).values(ticketsToCreate);
    return { message: "Tickets created successfully" };
  }

  async createMonthlyTicket({ userId, months = 1 }: CreateMonthlyTicketDto) {
    return this.db.transaction(async (tx) => {
      const [{ ticketId }] = await tx.insert(tickets).values({
        type: 'MONTHLY',
        status: 'AVAILABLE',
      }).returning({ ticketId: tickets.id });

      const validTo = new Date();
      validTo.setMonth(validTo.getMonth() + months);

      const [user] = await tx.select().from(users).where(eq(users.id, userId));
      if (!user) {
        throw new HttpException("User not found", 404);
      }

      await tx.insert(userTickets).values({
        userId,
        ticketId,
        validTo: validTo.toISOString(),
      })

      return { message: "Monthly ticket created successfully", ticketId };
    });
  }

  async createReservedTicket({ userId, months = 1, vehiclePlate, vehicleType, sectionId, slot }: CreateReservedTicketDto) {
    return this.db.transaction(async (tx) => {
      const user = await tx.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user.length) {
        throw new HttpException("User not found", 404);
      }

      const [{ ticketId }] = await tx
        .insert(tickets)
        .values({ type: "RESERVED", status: "AVAILABLE" })
        .returning({ ticketId: tickets.id });

      const validTo = new Date();
      validTo.setMonth(validTo.getMonth() + months);

      let [vehicle] = await tx.select().from(vehicles).where(eq(vehicles.plate, vehiclePlate));
      if (!vehicle) {
        [vehicle] = await tx.insert(vehicles).values({ plate: vehiclePlate, type: vehicleType }).returning();
      }

      await tx.insert(userTickets).values({
        userId,
        ticketId,
        validTo: validTo.toISOString(),
      });

      await tx.insert(vehicleReservations).values({
        ticketId,
        vehicleId: vehicle.id,
        sectionId,
        slot,
      });

      return { message: "Reservation ticket created successfully", ticketId };
    });
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
