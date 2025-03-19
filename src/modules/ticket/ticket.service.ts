import { Inject, Injectable } from '@nestjs/common';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { DRIZZLE } from 'src/database/drizzle.module';
import { DrizzleDB } from 'src/database/types/drizzle';
import { tickets, userTickets } from 'src/database/schema';
import { eq } from 'drizzle-orm';
import { UpdateTicketDto } from './dto/update-ticket.dto';

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

    if (!validTo) {
      request.validTo = type === "DAILY"
        ? new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 3).toISOString()
        : new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
    } else {
      request.validTo = new Date(validTo).toISOString();
    }

    await this.db.insert(tickets).values(request);
    return { message: "Ticket created successfully" };
  }

  async batchCreate(body: CreateTicketDto[]) {
    const requests = body.map(({ type, validTo }) => ({
      type,
      validTo: validTo
        ? new Date(validTo).toISOString()
        : type === "DAILY"
          ? new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 3).toISOString()
          : new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
    }));

    await this.db.insert(tickets).values(requests);

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
      }).where(eq(tickets.id, id));
    }
    return ticket;
  }

  async delete(id: number) {
    await this.db.delete(tickets).where(eq(tickets.id, id));
    return {}
  }
}
