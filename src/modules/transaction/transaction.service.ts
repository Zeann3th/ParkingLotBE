import { HttpException, Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { and, desc, eq, inArray, ne } from 'drizzle-orm';
import { UserInterface } from 'src/common/types';
import { DRIZZLE } from 'src/database/drizzle.module';
import { ticketPrices, tickets, transactions, users, userTickets } from 'src/database/schema';
import { DrizzleDB } from 'src/database/types/drizzle';
import { CreateTransactionDto, UpdateTransactionDto } from './dto/transaction.dto';

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

  async getAll(user: UserInterface, page: number = 1, limit: number = 10) {
    let transactionList: any;
    if (user.role === "ADMIN") {
      transactionList = await this.db.select().from(transactions)
        .orderBy(desc(transactions.id))
        .limit(limit).offset((page - 1) * limit);
    } else {
      transactionList = await this.db.select().from(transactions)
        .where(eq(transactions.userId, user.sub))
        .orderBy(desc(transactions.id))
        .limit(limit).offset((page - 1) * limit);
    }
    return transactionList;
  }

  async getById(user: UserInterface, id: number) {
    let transaction: any;
    if (user.role === "ADMIN") {
      [transaction] = await this.db.select().from(transactions)
        .where(eq(transactions.id, id));
    } else {
      [transaction] = await this.db.select().from(transactions)
        .where(and(
          eq(transactions.id, id),
          eq(transactions.userId, user.sub)
        ));
    }
    return transaction;
  }

  async create({ userId, amount, month, year }: CreateTransactionDto) {
    const [user] = await this.db.select().from(users)
      .where(eq(users.id, userId));

    if (!user) {
      throw new HttpException("User not found", 404);
    }

    try {
      await this.db.insert(transactions)
        .values({ userId, amount, month, year });
      return { message: "Transaction created successfully" };
    } catch (error: any) {
      if (error.code === "SQLITE_CONSTRAINT") {
        throw new HttpException("Transaction already exists", 409);
      }
      throw new HttpException("Failed to create transaction", 500);
    }
  }

  async update(id: number, { amount, status }: UpdateTransactionDto) {
    if (!amount && !status) {
      throw new HttpException("Missing required fields in payload", 400);
    }

    const [transaction] = await this.db.select().from(transactions)
      .where(eq(transactions.id, id));

    if (!transaction) {
      throw new HttpException("Transaction not found", 404);
    }

    await this.db.update(transactions)
      .set({
        amount: amount ?? transaction.amount,
        status: status ?? transaction.status
      })
      .where(eq(transactions.id, id));

    return { message: "Transaction updated successfully" };
  }

  async delete(id: number) {
    const [transaction] = await this.db.select().from(transactions)
      .where(eq(transactions.id, id));

    if (!transaction) {
      throw new HttpException("Transaction not found", 404);
    }

    await this.db.delete(transactions)
      .where(eq(transactions.id, id));
    return;
  }

}
