import { HttpException, Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { and, count, desc, eq, inArray, ne } from 'drizzle-orm';
import { UserInterface } from 'src/common/types';
import { DRIZZLE } from 'src/database/drizzle.module';
import { ticketPrices, tickets, transactions, users, userTickets } from 'src/database/schema';
import { DrizzleDB } from 'src/database/types/drizzle';
import { CreateTransactionDto, UpdateTransactionDto } from './dto/transaction.dto';
import crypto from 'crypto';
import env from 'src/common';
import { TransactionCheckOutDto } from './dto/transaction-check-out.dto';

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

  async checkOut(id: number, user: UserInterface, ip: string, { bankCode, language = "vn" }: TransactionCheckOutDto) {
    const [transaction] = await this.db.select().from(transactions)
      .where(and(
        eq(transactions.id, id),
        eq(transactions.userId, user.sub)
      ));

    if (!transaction) {
      throw new HttpException("Transaction not found", 404);
    }

    process.env.TZ = "Asia/Ho_Chi_Minh";

    const date = this.formatDate(new Date());

    let params = {
      "vnp_Version": "2.1.0",
      "vnp_Command": "pay",
      "vnp_TmnCode": env.GATEWAY.TMN_CODE,
      "vnp_local": language,
      "vnp_CurrCode": "VND",
      "vnp_TxnRef": String(id),
      "vnp_OrderInfo": `Transaction ID: ${id}`,
      "vnp_OrderType": "other",
      "vnp_Amount": String(transaction.amount * 100),
      "vnp_ReturnUrl": env.GATEWAY.RETURN_URL + "/transactions/checkout",
      "vnp_IpAddr": ip,
      "vnp_CreateDate": date,
      "vnp_BankCode": bankCode,
    };

    params = this.privatesortObject(params);

    const signData = Object.entries(params)
      .map(([key, value]) => `${key}=${value}`)
      .join("&");

    const hmac = crypto.createHmac("sha512", env.GATEWAY.HASH_SECRET);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    params["vnp_SecureHash"] = signed;

    return env.GATEWAY.URL + "?" + new URLSearchParams(params).toString();
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

  private formatDate = (date) => {
    const d = new Date(date);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  };

  privatesortObject = (obj: any): any => {
    const sorted: Record<string, string> = {};
    const keys: string[] = Object.keys(obj).map(encodeURIComponent).sort();

    for (const key of keys) {
      const originalKey = decodeURIComponent(key);
      sorted[key] = encodeURIComponent(String(obj[originalKey])).replace(/%20/g, "+");
    }

    return sorted;
  };
}
