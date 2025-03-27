import { Body, Controller, Delete, Get, Headers, HttpCode, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { User } from 'src/decorators/user.decorator';
import { UserInterface } from 'src/common/types';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { RolesGuard } from 'src/guards/role.guard';
import { Roles } from 'src/decorators/role.decorator';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CreateTransactionDto, UpdateTransactionDto } from './dto/transaction.dto';

@Controller('transactions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransactionController {
  constructor(
    private readonly transactionService: TransactionService,
    @InjectRedis() private readonly redis: Redis
  ) { }

  @ApiOperation({ summary: "Get all transactions" })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: "Return all transactions" })
  @Roles("ADMIN", "USER")
  @Get()
  async getAll(
    @Headers("Cache-Control") cacheOption: string,
    @User() user: UserInterface,
    @Query("page") page: number,
    @Query("limit") limit: number
  ) {
    const key = user.role === "ADMIN" ? "transactions:${page}:${limit}" : `transactions:${user.sub}:${page}:${limit}`;
    if (cacheOption && cacheOption !== "no-cache") {
      const cachedTransactions = await this.redis.get(key);
      if (cachedTransactions) {
        return JSON.parse(cachedTransactions);
      }
    }
    const transactionList = await this.transactionService.getAll(user, page, limit);
    await this.redis.set(key, JSON.stringify(transactionList), "EX", 60 * 60);
    return transactionList;
  }

  @ApiOperation({ summary: "Get transaction by id" })
  @ApiParam({ name: "id", description: "Transaction id" })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: "Return transaction" })
  @Roles("ADMIN", "USER")
  @Get(":id")
  async getById(
    @Headers("Cache-Control") cacheOption: string,
    @User() user: UserInterface,
    @Param("id") id: number
  ) {
    const key = user.role === "ADMIN" ? `transactions:${id}` : `transactions:${user.sub}:${id}`;
    if (cacheOption && cacheOption !== "no-cache") {
      const cachedTransaction = await this.redis.get(key);
      if (cachedTransaction) {
        return JSON.parse(cachedTransaction);
      }
    }
    const transaction = await this.transactionService.getById(user, id);
    await this.redis.set(key, JSON.stringify(transaction), "EX", 60 * 60);
    return transaction;
  }

  @ApiOperation({ summary: "Create a transaction" })
  @ApiBody({
    type: "object",
    schema: {
      properties: {
        userId: { type: "number" },
        amount: { type: "number" },
        month: { type: "number" },
        year: { type: "number" },
      },
      required: ["userId", "amount", "month", "year"]
    }
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: "Transaction created successfully" })
  @ApiResponse({ status: 404, description: "User not found" })
  @ApiResponse({ status: 409, description: "Transaction already exists" })
  @ApiResponse({ status: 500, description: "Failed to create transaction" })
  @Roles("ADMIN")
  @Post()
  async create(@Body() body: CreateTransactionDto) {
    return await this.transactionService.create(body);
  }

  @ApiOperation({ summary: "Update transaction by id" })
  @ApiParam({ name: "id", description: "Transaction id" })
  @ApiBody({
    type: "object",
    schema: {
      properties: {
        amount: { type: "number" },
        month: { type: "number" },
        year: { type: "number" },
        status: { type: "string" }
      },
      required: []
    }
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: "Transaction updated" })
  @ApiResponse({ status: 404, description: "Transaction not found" })
  @Roles("ADMIN")
  @Patch(":id")
  async update(@Param("id") id: number, @Body() body: UpdateTransactionDto) {
    return await this.transactionService.update(id, body);
  }

  @ApiOperation({ summary: "Delete transaction by id" })
  @ApiParam({ name: "id", description: "Transaction id" })
  @ApiBearerAuth()
  @ApiResponse({ status: 204, description: "Transaction deleted" })
  @ApiResponse({ status: 404, description: "Transaction not found" })
  @HttpCode(204)
  @Roles("ADMIN")
  @Delete(":id")
  async delete(@Param("id") id: number) {
    await this.transactionService.delete(id);
    return;
  }
}
