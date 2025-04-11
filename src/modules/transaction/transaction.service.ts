import { HttpException, Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { and, count, desc, eq, inArray, ne } from 'drizzle-orm';
import { UserInterface } from 'src/common/types';
import { DRIZZLE } from 'src/database/drizzle.module';
import { ticketPrices, tickets, transactions, usersView, userTickets } from 'src/database/schema';
import { DrizzleDB } from 'src/database/types/drizzle';
import { CreateTransactionDto, UpdateTransactionDto } from './dto/transaction.dto';
import { createHmac } from "crypto";
import env from 'src/common';
import { CreateOrder, OrderResult } from './types';
import axios from 'axios';

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
      ));

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

  async getAll(user: UserInterface, page: number, limit: number) {
    let countResult: number = 0;
    let data: any[] = [];
    if (user.role === "ADMIN") {
      [[{ countResult }], data] = await Promise.all([
        this.db.select({ countResult: count() }).from(transactions),
        this.db.select().from(transactions)
          .orderBy(desc(transactions.id))
          .limit(limit).offset((page - 1) * limit)
      ]);

    } else {
      [[{ countResult }], data] = await Promise.all([
        this.db.select({ countResult: count() }).from(transactions)
          .where(eq(transactions.userId, user.sub)),
        this.db.select().from(transactions)
          .where(eq(transactions.userId, user.sub))
          .orderBy(desc(transactions.id))
          .limit(limit).offset((page - 1) * limit)
      ]);
    }

    return { count: Math.ceil(countResult / limit), data };
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
    const [user] = await this.db.select().from(usersView)
      .where(eq(usersView.id, userId));

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

  async checkOut(id: number, user: UserInterface) {
    const [transaction] = await this.db.select().from(transactions)
      .where(and(
        eq(transactions.id, id),
        eq(transactions.userId, user.sub)
      ));

    if (!transaction) {
      throw new HttpException("Transaction not found", 404);
    }

    const transId = `${Date.now()}${transaction.id}`;

    const date = new Date();
    const order: CreateOrder = {
      app_id: String(env.GATEWAY.APP_ID),
      app_trans_id: `${date.getFullYear().toString().slice(-2)}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}_${transId}`,
      app_user: String(`${user.sub}_${user.username}`),
      app_time: Date.now(),
      amount: 200000,
      item: JSON.stringify([{ price: transaction.amount, month: transaction.month, year: transaction.year }]),
      embed_data: JSON.stringify({ redirectUrl: `${env.APP_URL}/transactions/${transaction.id}` }),
      //callback_url: "http://localhost:8080/v1/transactions/callback",
      description: `Transaction for ticket purchase. Transaction ID: ${transaction.id}`,
      bank_code: "zalopayapp",
    };

    const data =
      env.GATEWAY.APP_ID +
      "|" + order.app_trans_id +
      "|" + order.app_user +
      "|" + order.amount +
      "|" + order.app_time +
      "|" + order.embed_data +
      "|" + order.item;

    order.mac = createHmac("sha256", env.GATEWAY.PUBLIC_KEY)
      .update(data)
      .digest("hex");

    console.log("order", order);

    const res = await axios.post("https://sb-openapi.zalopay.vn/v2/create", null,
      { params: order }
    );

    return { ...res.data, app_trans_id: order.app_trans_id };
  }

  async callback(data: string, reqMac: string) {
    if (!data || !reqMac) {
      throw new HttpException("Missing required fields in payload", 400);
    }
    let result: OrderResult;
    try {
      const mac = createHmac("sha256", env.GATEWAY.PRIVATE_KEY)
        .update(data)
        .digest("hex");

      if (reqMac !== mac) {
        result = {
          return_code: -1,
          return_message: "mac not equal",
        };
      } else {
        result = {
          return_code: 1,
          return_message: "success",
        };
      }
    } catch (err) {
      result = {
        return_code: 0,
        return_message: (err as any).message,
      };
    }
    return result;
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
        status: status ?? transaction.status,
        updatedAt: (new Date()).toISOString(),
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
