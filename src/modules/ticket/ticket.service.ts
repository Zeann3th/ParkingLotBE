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
    const ticketList = await this.db.select().from(tickets)
      .leftJoin(userTickets, eq(userTickets.ticketId, tickets.id));

    const res = ticketList.map(({ tickets, user_tickets }) => ({ ...tickets, ...user_tickets }));

    if (user.role === "ADMIN" || user.role === "SECURITY") {
      return res;
    }

    return res.filter(({ userId }) => userId === user.sub);
  }

  async getById(user: UserInterface, id: number) {
    if (user.role !== "ADMIN" && user.role !== "SECURITY") {
      const [userTicket] = await this.db.select()
        .from(userTickets)
        .where(and(
          eq(userTickets.ticketId, id),
          eq(userTickets.userId, user.sub)
        ));

      if (!userTicket) {
        throw new HttpException("Not authorized to access this ticket", 403);
      }
    }

    const [ticket] = await this.db.select().from(tickets)
      .where(eq(tickets.id, id))
      .leftJoin(userTickets, eq(userTickets.ticketId, tickets.id));

    if (!ticket) {
      throw new HttpException("Ticket not found", 404);
    }

    return { ...ticket.tickets, ...ticket.user_tickets };
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

      if (slot < 1 || slot > section.capacity) {
        throw new HttpException("Invalid slot number", 400);
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

  async reserve(user: UserInterface, id: number, { sectionId, slot }: ReserveTicketDto) {
    await this.db.transaction(async (tx) => {
      const [{ ticket, userTicket, vehicle }] = await tx
        .select({ ticket: tickets, userTicket: userTickets, vehicle: vehicles })
        .from(userTickets)
        .where(eq(userTickets.ticketId, id))
        .leftJoin(tickets, eq(tickets.id, userTickets.ticketId))
        .leftJoin(vehicles, eq(vehicles.id, userTickets.vehicleId));

      if (!ticket) {
        throw new HttpException("Ticket not found or not accessible", 404);
      }

      if (user.role !== "ADMIN" && user.sub !== userTicket.userId) {
        throw new HttpException("Not authorized to reserve a slot for this ticket", 403);
      }

      if (ticket.type !== "RESERVED") {
        throw new HttpException("Ticket is not a reserved ticket", 400);
      }

      if (!vehicle) {
        throw new HttpException("Vehicle not found", 400);
      }

      if (vehicle.type !== "CAR") {
        throw new HttpException("Vehicle must be a car to reserve a slot", 400);
      }

      const [section] = await tx.select().from(sections)
        .where(eq(sections.id, sectionId));

      if (!section) {
        throw new HttpException("Section not found", 404);
      }

      if (slot < 1 || slot > section.capacity) {
        throw new HttpException("Invalid slot number", 400);
      }

      const [existingSlot] = await tx.select().from(vehicleReservations)
        .where(and(
          eq(vehicleReservations.sectionId, sectionId),
          eq(vehicleReservations.slot, slot)
        ))

      if (existingSlot) {
        throw new HttpException(`Slot ${slot}, section ${section.name} is already reserved`, 409);
      }

      await tx.insert(vehicleReservations).values({
        ticketId: ticket.id,
        sectionId,
        slot
      });
    });

    return { message: "Slot reserved successfully" };
  }

  async cancel(user: UserInterface, id: number, sectionId: number) {
    await this.db.transaction(async (tx) => {

      const [{ ticket, userTicket, vehicle }] = await tx
        .select({ ticket: tickets, userTicket: userTickets, vehicle: vehicles })
        .from(userTickets)
        .where(eq(userTickets.ticketId, id))
        .leftJoin(tickets, eq(tickets.id, userTickets.ticketId))
        .leftJoin(vehicles, eq(vehicles.id, userTickets.vehicleId));

      if (!ticket) {
        throw new HttpException("Ticket not found or not accessible", 404);
      }

      if (user.role !== "ADMIN" && user.sub !== userTicket.userId) {
        throw new HttpException("Not authorized to cancel this ticket", 403);
      }

      if (ticket.status === "CANCELED") {
        throw new HttpException("Ticket already canceled", 400);
      }

      if (!vehicle) {
        throw new HttpException("Vehicle not found", 400);
      }

      const [section] = await tx.select().from(sections)
        .where(eq(sections.id, sectionId));

      if (!section) {
        throw new HttpException("Section not found", 404);
      }

      await tx.update(tickets).set({ status: "CANCELED" })
        .where(eq(tickets.id, id));

      if (ticket.type !== "RESERVED") {
        return { message: "User's subscription canceled" };
      }

      const [existingSlot] = await tx.select().from(vehicleReservations)
        .where(and(
          eq(vehicleReservations.ticketId, ticket.id),
          eq(vehicleReservations.sectionId, sectionId)
        ));

      if (!existingSlot) {
        throw new HttpException("No reservation found for this ticket in the specified section", 400);
      }

      await tx.delete(vehicleReservations).where(and(
        eq(vehicleReservations.ticketId, ticket.id),
        eq(vehicleReservations.sectionId, sectionId)
      ));
    });

    return { message: "User's subscription canceled, slot unreserved" };
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
    return;
  }
}
