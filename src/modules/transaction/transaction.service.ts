import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { and, eq, inArray, ne } from 'drizzle-orm';
import { DRIZZLE } from 'src/database/drizzle.module';
import { ticketPrices, tickets, transactions, userTickets } from 'src/database/schema';
import { DrizzleDB } from 'src/database/types/drizzle';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) { }

  @Cron("0 0 0 1 * *")
  async createTransaction() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const ticketList = await this.db.select({ userTicket: userTickets, price: ticketPrices }).from(userTickets)
      .leftJoin(tickets, eq(tickets.id, userTickets.ticketId))
      .leftJoin(ticketPrices, eq(ticketPrices.type, tickets.type))
      .where(and(
        inArray(tickets.type, ["MONTHLY", "RESERVED"]),
        ne(tickets.status, "LOST"),
        ne(tickets.status, "CANCELED"),
      ))

    const transactionList = ticketList
      .filter(({ price }) => price !== null)
      .map(({ userTicket, price }) => {
        const amount = price!.price;
        const userId = userTicket.userId;
        return { userId, amount, month, year };
      });

    if (transactionList.length === 0) {
      this.logger.log("No transactions to create");
      return;
    }

    await this.db.insert(transactions).values(transactionList);
    this.logger.log(`${transactionList.length} transactions created`);
    return;
  }

}
