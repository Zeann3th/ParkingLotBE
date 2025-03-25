import { HttpException, Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from 'src/database/drizzle.module';
import { DrizzleDB } from 'src/database/types/drizzle';
import { sections, ticketPrices, tickets, users, userTickets, vehicleReservations, vehicles } from 'src/database/schema';
import { and, eq } from 'drizzle-orm';
import { UpdateTicketDto, UpdateTicketPricingDto } from './dto/update-ticket.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { ReserveTicketDto } from './dto/reserve-ticket.dto';
import { UserInterface } from 'src/common/types';

@Injectable()
export class TicketService {

  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) { }

  async getAll(user: UserInterface) {
    if (user.role === "ADMIN") {
      return await this.db.select().from(tickets);
    } else {
      const [ticket] = await this.db.select().from(tickets)
        .innerJoin(userTickets, eq(userTickets.ticketId, tickets.id))
        .where(eq(userTickets.userId, user.sub))
      return { ...ticket.tickets, ...ticket.user_tickets }
    }
  }

  async getById(id: number) {
    const [ticket] = await this.db.select().from(tickets).where(eq(tickets.id, id));
    return ticket;
  }

  async create({ type, userId, vehicleId, sectionId, slot }: CreateTicketDto) {
    return await this.db.transaction(async (tx) => {
      const [{ ticketId }] = await tx.insert(tickets)
        .values({ type })
        .returning({ ticketId: tickets.id });

      if (type === "DAILY") {
        return { message: "Daily ticket created successfully", ticketId };
      }

      const [user] = await tx.select()
        .from(users)
        .where(eq(users.id, userId));
      if (!user) {
        throw new HttpException("User not found", 404);
      }

      const [section] = await tx.select()
        .from(sections)
        .where(eq(sections.id, sectionId))
      if (!section) {
        throw new HttpException("Section not found", 404);
      }

      const [vehicle] = await tx.select()
        .from(vehicles)
        .where(eq(vehicles.id, vehicleId))
      if (!vehicle) {
        throw new HttpException("Vehicle not found", 404);
      }


      const [userTicket] = await tx.insert(userTickets)
        .values({
          userId,
          ticketId,
          vehicleId
        })
        .returning();

      if (type === "MONTHLY") {
        return { message: "Monthly ticket created successfully", ticketId };
      }

      if (vehicle.type !== "CAR") {
        throw new HttpException("Vehicle must be a car to reserve a slot", 400);
      }

      const [existingSlot] = await tx.select()
        .from(vehicleReservations)
        .where(and(
          eq(vehicleReservations.sectionId, sectionId),
          eq(vehicleReservations.slot, slot)
        ));
      if (existingSlot) {
        throw new HttpException(`Slot ${slot}, section ${section.name} is already reserved`, 409);
      }

      await tx.insert(vehicleReservations)
        .values({
          ticketId,
          sectionId,
          slot,
        });
      return { message: "Reserved ticket created successfully", ticketId };
    });
  }

  async createDailyTickets(amount: number) {
    if (amount <= 0) {
      throw new HttpException("Amount must be greater than 0", 400);
    }
    const ticketsToCreate = Array.from({ length: amount }, () => ({
      type: 'DAILY' as const,
    }));

    await this.db.insert(tickets).values(ticketsToCreate);
    return { message: "Tickets created successfully" };
  }

  async update(id: number, { type, status }: UpdateTicketDto) {
    const [ticket] = await this.db.select().from(tickets).where(eq(tickets.id, id));
    if (!ticket) {
      throw new HttpException("Ticket not found", 404);
    }

    const [updatedTicket] = await this.db.update(tickets).set({
      ...(type && { type }),
      ...(status && { status }),
    }).where(eq(tickets.id, id)).returning();
    return updatedTicket;
  }

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
