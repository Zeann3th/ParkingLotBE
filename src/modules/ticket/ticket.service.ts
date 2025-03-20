import { Inject, Injectable } from '@nestjs/common';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { DRIZZLE } from 'src/database/drizzle.module';
import { DrizzleDB } from 'src/database/types/drizzle';
import { ticketPrices, tickets, userTickets } from 'src/database/schema';
import { and, eq } from 'drizzle-orm';
import { UpdateTicketDto, UpdateTicketPricingDto } from './dto/update-ticket.dto';

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

  async create({ type, validTo }: CreateTicketDto) {
    const request: any = {
      ...type && { type },
    }

    if (type !== "DAILY") {
      if (!validTo) {
        request.validTo = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
      } else {
        request.validTo = new Date(validTo).toISOString();
      }
    }

    await this.db.insert(tickets).values(request);
    return { message: "Ticket created successfully" };
  }

  async batchCreateDailies({ amount }: { amount: number }) {
    const ticketsToCreate = Array.from({ length: amount }, () => ({
      type: 'DAILY' as const,
      status: 'AVAILABLE' as const,
    }));

    await this.db.insert(tickets).values(ticketsToCreate);
    return { message: "Tickets created successfully" };
  }

  async update(id: number, { type, status, validFrom, validTo }: UpdateTicketDto) {
    const [ticket] = await this.db.update(tickets).set({
      ...type && { type },
      ...status && { status },
    }).where(eq(tickets.id, id)).returning();

    if (validFrom || validTo) {
      await this.db.update(userTickets).set({
        ...validFrom && { validFrom: new Date(validFrom).toISOString() },
        ...validTo && { validTo: new Date(validTo).toISOString() },
      }).where(eq(userTickets.ticketId, id));
    }

    return ticket;
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
