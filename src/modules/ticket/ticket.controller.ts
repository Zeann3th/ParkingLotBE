import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, UseGuards, Headers, Query } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { RolesGuard } from 'src/guards/role.guard';
import { Roles } from 'src/decorators/role.decorator';
import { UpdateTicketDto, UpdateTicketPricingDto } from './dto/update-ticket.dto';
import { ApiBearerAuth, ApiBody, ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { ReserveTicketDto } from './dto/reserve-ticket.dto';
import { User } from 'src/decorators/user.decorator';
import { UserInterface } from 'src/common/types';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketController {
  constructor(
    private readonly ticketService: TicketService,
    @InjectRedis() private readonly redis: Redis
  ) { }

  @ApiOperation({ summary: "Get all tickets" })
  @ApiHeader({
    name: "Cache-Control",
    required: false,
    description: "no-cache to ignore cache"
  })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: "Return all tickets" })
  @Roles("ADMIN", "SECURITY", "USER")
  @Get()
  async getAll(
    @Headers("Cache-Control") cacheOption: string,
    @User() user: UserInterface,
    @Query("page", ParseIntPipe) page: number,
    @Query("limit", ParseIntPipe) limit: number
  ) {
    const key = user.role !== "USER" ? `tickets:${page}:${limit}` : `tickets:${user.sub}:${page}:${limit}`;
    if (cacheOption && cacheOption !== "no-cache") {
      const cachedTickets = await this.redis.get(key);
      if (cachedTickets) {
        return JSON.parse(cachedTickets);
      }
    }
    const tickets = await this.ticketService.getAll(user, page, limit);
    await this.redis.set(key, JSON.stringify(tickets), "EX", 60 * 10);
    return tickets;
  }

  @ApiOperation({ summary: "Get ticket by id" })
  @ApiHeader({
    name: "Cache-Control",
    required: false,
    description: "no-cache to ignore cache"
  })
  @ApiParam({ name: "id", description: "Ticket id" })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: "Return ticket" })
  @Roles("ADMIN", "SECURITY", "USER")
  @Get(":id")
  async getById(
    @Headers("Cache-Control") cacheOption: string,
    @User() user: UserInterface,
    @Param("id", ParseIntPipe) id: number) {
    const key = user.role !== "USER" ? `tickets:${id}` : `tickets:${user.sub}:${id}`;
    if (cacheOption && cacheOption !== "no-cache") {
      const cachedTicket = await this.redis.get(key);
      if (cachedTicket) {
        return JSON.parse(cachedTicket);
      }
    }
    const ticket = await this.ticketService.getById(user, id);
    await this.redis.set(key, JSON.stringify(ticket), "EX", 60 * 10);
    return ticket;
  }

  @ApiOperation({ summary: "Create a ticket" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        type: { type: "string", example: "DAILY" },
        userId: { type: "number", example: 1 },
        vehicleId: { type: "number", example: 1 },
        sectionId: { type: "number", example: 1 },
        slot: { type: "number", example: 1 }
      },
      required: ["type"]
    }
  })
  @ApiBearerAuth()
  @Roles("ADMIN", "SECURITY")
  @Post()
  async create(@Body() body: CreateTicketDto) {
    return await this.ticketService.create(body);
  }

  @ApiOperation({ summary: "Create batch of daily tickets" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        amount: { type: "number", example: 10 }
      },
      required: ["amount"]
    }
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: "Tickets created successfully" })
  @Roles("ADMIN", "SECURITY")
  @Post("dailies")
  async createDailyTickets(@Body("amount") amount: number) {
    return await this.ticketService.createDailyTickets(amount);
  }

  @ApiOperation({ summary: "Get ticket pricing", description: "Get ticket pricing" })
  @ApiHeader({
    name: "Cache-Control",
    required: false,
    description: "no-cache to ignore cache"
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: "Get ticket pricing" })
  @Roles("ADMIN", "SECURITY")
  @Get("pricing")
  async getPricing(@Headers("Cache-Control") cacheOption: string) {
    if (cacheOption && cacheOption !== "no-cache") {
      const cachedPricing = await this.redis.get("tickets:pricing");
      if (cachedPricing) {
        return JSON.parse(cachedPricing);
      }
    }
    const pricing = await this.ticketService.getPricing();
    await this.redis.set("tickets:pricing", JSON.stringify(pricing), "EX", 60 * 10);
    return pricing;
  }

  @ApiOperation({ summary: "Update ticket pricing" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        type: { type: "string", example: "DAILY" },
        price: { type: "number", example: 25000 },
        vehicleType: { type: "string", example: "CAR" }
      }
    }
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: "Ticket pricing updated successfully" })
  @Roles("ADMIN")
  @Patch("pricing")
  async updatePricing(@Body() body: UpdateTicketPricingDto) {
    return await this.ticketService.updatePricing(body);
  }

  @ApiOperation({ summary: "Update a ticket" })
  @ApiParam({ name: "id", description: "Ticket id" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        type: { type: "string", example: "DAILY" },
        status: { type: "string", example: "AVAILABLE" }
      },
      required: []
    }
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: "Ticket updated successfully" })
  @ApiResponse({ status: 400, description: "Missing required fields in payload" })
  @Roles("ADMIN")
  @Patch(":id")
  async update(@Param("id", ParseIntPipe) id: number, @Body() body: UpdateTicketDto) {
    return await this.ticketService.update(id, body);
  }

  @ApiOperation({ summary: "Reserve a slot" })
  @ApiParam({ name: "id", description: "Ticket id" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        sectionId: { type: "number", example: 1 },
        slot: { type: "number", example: 1 }
      },
      required: ["sectionId", "slot"]
    }
  })
  @ApiBearerAuth()
  @Roles("ADMIN", "USER")
  @Patch(":id/reserve")
  async reserve(@User() user: UserInterface, @Param("id", ParseIntPipe) id: number, @Body() body: ReserveTicketDto) {
    return await this.ticketService.reserve(user, id, body);
  }

  @ApiOperation({ summary: "Cancel user's ticket subscription" })
  @ApiParam({ name: "id", description: "Ticket id" })
  @ApiBody({
    type: "object",
    schema: {
      properties: {
        sectionId: { type: "number", example: 1 }
      },
      required: ["sectionId"]
    }
  })
  @ApiBearerAuth()
  @Roles("ADMIN", "USER")
  @Patch(":id/cancel")
  async cancel(@User() user: UserInterface, @Param("id", ParseIntPipe) id: number, @Body("sectionId", ParseIntPipe) sectionId: number) {
    return await this.ticketService.cancel(user, id, sectionId);
  }

  @ApiOperation({ summary: "Delete a ticket" })
  @ApiParam({ name: "id", description: "Ticket id" })
  @ApiBearerAuth()
  @ApiResponse({ status: 204, description: "Ticket deleted successfully" })
  @HttpCode(204)
  @Roles("ADMIN")
  @Delete(":id")
  async delete(@Param("id", ParseIntPipe) id: number) {
    return await this.ticketService.delete(id);
  }
}












