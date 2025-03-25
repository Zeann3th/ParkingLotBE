import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { RolesGuard } from 'src/guards/role.guard';
import { Roles } from 'src/decorators/role.decorator';
import { UpdateTicketDto, UpdateTicketPricingDto } from './dto/update-ticket.dto';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { ReserveTicketDto } from './dto/reserve-ticket.dto';
import { User } from 'src/decorators/user.decorator';
import { UserInterface } from 'src/common/types';

@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketController {
  constructor(private readonly ticketService: TicketService) { }

  @ApiOperation({ summary: "Get all tickets" })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: "Return all tickets" })
  @Roles("ADMIN", "USER")
  @Get()
  async getAll(@User() user: UserInterface) {
    return await this.ticketService.getAll(user);
  }

  @ApiOperation({ summary: "Get ticket by id" })
  @ApiParam({ name: "id", description: "Ticket id" })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: "Return ticket" })
  @Roles("ADMIN", "USER")
  @Get(":id")
  async getById(@User() user: UserInterface, @Param("id", ParseIntPipe) id: number) {
    return await this.ticketService.getById(id);
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
  @Roles("ADMIN")
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
  @Roles("ADMIN")
  @Post("dailies")
  async createDailyTickets(@Body("amount") amount: number) {
    return await this.ticketService.createDailyTickets(amount);
  }

  @ApiOperation({ summary: "Get ticket pricing", description: "Get ticket pricing" })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: "Get ticket pricing" })
  @Get("pricing")
  async getPricing() {
    return await this.ticketService.getPricing();
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
  @Roles("ADMIN")
  @Patch(":id")
  async update(@Param("id", ParseIntPipe) id: number, @Body() body: UpdateTicketDto) {
    return await this.ticketService.update(id, body);
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











 
