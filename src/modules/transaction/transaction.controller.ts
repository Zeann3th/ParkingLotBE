import { Body, Controller, DefaultValuePipe, Delete, Get, Headers, HttpCode, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { User } from 'src/decorators/user.decorator';
import { UserInterface } from 'src/common/types';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { RolesGuard } from 'src/guards/role.guard';
import { Roles } from 'src/decorators/role.decorator';
import { ApiBearerAuth, ApiBody, ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CreateTransactionDto, UpdateTransactionDto } from './dto/transaction.dto';

@Controller('transactions')
export class TransactionController {
  constructor(
    private readonly transactionService: TransactionService,
    @InjectRedis() private readonly redis: Redis
  ) { }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: "Get all transactions" })
  @ApiHeader({
    name: "Cache-Control",
    required: false,
    description: "no-cache to ignore cache"
  })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: "Return all transactions" })
  @Roles("ADMIN", "USER")
  @Get()
  async getAll(
    @Headers("Cache-Control") cacheOption: string,
    @User() user: UserInterface,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(10), ParseIntPipe) limit: number
  ) {
    const key = user.role === "ADMIN" ? `transactions:${page}:${limit}` : `transactions:${user.sub}:${page}:${limit}`;
    if (cacheOption && cacheOption !== "no-cache") {
      const cachedTransactions = await this.redis.get(key);
      if (cachedTransactions) {
        return JSON.parse(cachedTransactions);
      }
    }
    const transactionList = await this.transactionService.getAll(user, page, limit);
    await this.redis.set(key, JSON.stringify(transactionList), "EX", 60 * 10);
    return transactionList;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: "Get transaction by id" })
  @ApiHeader({
    name: "Cache-Control",
    required: false,
    description: "no-cache to ignore cache"
  })
  @ApiParam({ name: "id", description: "Transaction id" })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: "Return transaction" })
  @Roles("ADMIN", "USER")
  @Get(":id")
  async getById(
    @Headers("Cache-Control") cacheOption: string,
    @User() user: UserInterface,
    @Param("id", ParseIntPipe) id: number
  ) {
    const key = user.role === "ADMIN" ? `transactions:${id}` : `transactions:${user.sub}:${id}`;
    if (cacheOption && cacheOption !== "no-cache") {
      const cachedTransaction = await this.redis.get(key);
      if (cachedTransaction) {
        return JSON.parse(cachedTransaction);
      }
    }
    const transaction = await this.transactionService.getById(user, id);
    await this.redis.set(key, JSON.stringify(transaction), "EX", 60 * 10);
    return transaction;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: "Check out transaction" })
  @ApiParam({ name: "id", description: "Transaction id" })
  @Post(":id/checkout")
  @Roles("USER")
  @ApiBearerAuth()
  async checkOut(
    @User() user: UserInterface,
    @Param("id", ParseIntPipe) id: number,
  ) {
    return await this.transactionService.checkOut(id, user);
  }

  @ApiOperation({ summary: "Callback from payment gateway" })
  @ApiBody({
    type: "object",
    schema: {
      properties: {
        data: { type: "string" },
        mac: { type: "string" }
      },
      required: ["data", "mac"]
    }
  })
  @Post("callback")
  @HttpCode(200)
  async callback(
    @Body("data") data: string,
    @Body("mac") mac: string,
  ) {
    return await this.transactionService.callback(data, mac);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: "Update transaction by id" })
  @ApiParam({ name: "id", description: "Transaction id" })
  @ApiBody({
    type: "object",
    schema: {
      properties: {
        amount: { type: "number" },
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
  async update(@Param("id", ParseIntPipe) id: number, @Body() body: UpdateTransactionDto) {
    return await this.transactionService.update(id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: "Delete transaction by id" })
  @ApiParam({ name: "id", description: "Transaction id" })
  @ApiBearerAuth()
  @ApiResponse({ status: 204, description: "Transaction deleted" })
  @ApiResponse({ status: 404, description: "Transaction not found" })
  @HttpCode(204)
  @Roles("ADMIN")
  @Delete(":id")
  async delete(@Param("id", ParseIntPipe) id: number) {
    await this.transactionService.delete(id);
    return;
  }
}
