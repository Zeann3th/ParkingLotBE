import { HttpException, Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from 'src/database/drizzle.module';
import { DrizzleDB } from 'src/database/types/drizzle';
import { sections, ticketPrices, tickets, usersView, userTickets, vehicleReservations, vehicles } from 'src/database/schema';
import { and, count, eq } from 'drizzle-orm';
import { UpdateTicketDto, UpdateTicketPricingDto } from './dto/update-ticket.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { ReserveTicketDto } from './dto/reserve-ticket.dto';
import { UserInterface } from 'src/common/types';

@Injectable()
export class TicketService {

  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) { }

  async getAll(user: UserInterface, page: number, limit: number) {
    let countResult: number = 0;
    let data: any[] = [];
    if (user.role === "ADMIN" || user.role === "SECURITY") {
      [[{ countResult }], data] = await Promise.all([
        this.db.select({ countResult: count() }).from(tickets),
        this.db.select().from(tickets)
          .limit(limit).offset((page - 1) * limit)
      ]);

      return { maxPage: Math.ceil(countResult / limit), data };
    } else {
      [[{ countResult }], data] = await Promise.all([
        this.db.select({ countResult: count() }).from(userTickets)
          .leftJoin(tickets, eq(tickets.id, userTickets.ticketId))
          .where(eq(userTickets.userId, user.sub)),
        this.db.select({ tickets: tickets, user_tickets: userTickets }).from(userTickets)
          .leftJoin(tickets, eq(tickets.id, userTickets.ticketId))
          .where(eq(userTickets.userId, user.sub))
      ]);

      return {
        maxPage: Math.ceil(countResult / limit),
        data: data.map(({ tickets, user_tickets }) => {
          const { ticketId, ...rest } = user_tickets;
          return { ...tickets, ...rest };
        })
      };
    }
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

  async create(dto: CreateTicketDto) {
    return await this.db.transaction(async (tx) => {
      const {
        type,
        userId = null,
        vehicleId = null,
        sectionId = null,
        slot = null
      } = dto;

      const [{ ticketId }] = await tx.insert(tickets)
        .values({ type })
        .returning({ ticketId: tickets.id });

      if (type === "DAILY") {
        return { message: "Daily ticket created successfully", ticketId };
      }

      if (!userId || !vehicleId) {
        throw new HttpException("User ID and Vehicle ID are required for non-daily tickets", 400);
      }

      const [user] = await tx.select()
        .from(usersView)
        .where(eq(usersView.id, userId));
      if (!user) {
        throw new HttpException("User not found", 404);
      }

      const [vehicle] = await tx.select()
        .from(vehicles)
        .where(eq(vehicles.id, vehicleId));
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

      if (type === "RESERVED") {
        if (!sectionId || !slot) {
          throw new HttpException("Section ID and Slot are required for reserved tickets", 400);
        }

        if (vehicle.type !== "CAR") {
          throw new HttpException("Vehicle must be a car to reserve a slot", 400);
        }

        const [section] = await tx.select()
          .from(sections)
          .where(eq(sections.id, sectionId));
        if (!section) {
          throw new HttpException("Section not found", 404);
        }

        if (slot < 1 || slot > section.capacity) {
          throw new HttpException("Invalid slot number", 400);
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
      }

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
    if (!type && !status) {
      throw new HttpException("Missing required fields in payload", 400);
    }

    const [ticket] = await this.db.select().from(tickets).where(eq(tickets.id, id));
    if (!ticket) {
      throw new HttpException("Ticket not found", 404);
    }

    const [updatedTicket] = await this.db.update(tickets).set({
      type: type ?? ticket.type,
      status: status ?? ticket.status,
      updatedAt: (new Date()).toISOString(),
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
        ));

      if (existingSlot) {
        throw new HttpException(`Slot ${slot}, section ${section.name} is already reserved`, 409);
      }

      await tx.insert(vehicleReservations).values({
        ticketId: ticket.id,
        sectionId,
        slot
      });

      await tx.update(tickets).set({ status: "AVAILABLE", updatedAt: (new Date()).toISOString() })
        .where(eq(tickets.id, id));
    });

    return { message: "Slot reserved successfully" };
  }

  async cancel(user: UserInterface, id: number) {
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

      await tx.update(tickets).set({ status: "CANCELED", updatedAt: (new Date()).toISOString() })
        .where(eq(tickets.id, id));

      if (ticket.type !== "RESERVED") {
        return { message: "User's subscription canceled" };
      }

      const [existingSlot] = await tx.select().from(vehicleReservations)
        .where(eq(vehicleReservations.ticketId, ticket.id));

      if (!existingSlot) {
        throw new HttpException("No reservation found for this ticket in the specified section", 400);
      }

      await tx.delete(vehicleReservations).where(eq(vehicleReservations.ticketId, ticket.id));
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
