import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { RolesGuard } from 'src/guards/role.guard';
import { Roles } from 'src/decorators/role.decorator';
import { UpdateTicketDto, UpdateTicketPricingDto } from './dto/update-ticket.dto';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CreateDailyTicketDto, CreateTicketDto } from './dto/create-ticket.dto';

@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
export class TicketController {
  constructor(private readonly ticketService: TicketService) { }

  @ApiOperation({ summary: "Get all tickets", description: "Get all tickets" })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: "Return all tickets" })
  @Get()
  async getAll() {
    return await this.ticketService.getAll();
  }

  @ApiOperation({ summary: "Get ticket by id", description: "Get ticket by id" })
  @ApiParam({ name: "id", description: "Ticket id" })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: "Return ticket" })
  @Get(":id")
  async getById(@Param("id") id: number) {
    return await this.ticketService.getById(id);
  }

  async create(@Body() body: CreateTicketDto) {
    return await this.ticketService.create(body);
  }

  @ApiOperation({ summary: "Create batch of daily tickets", description: "Create batch of daily tickets" })
  @ApiBody({
    schema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          amount: { type: "number", example: 10 }
        }
      }
    }
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: "Tickets created successfully" })
  @Post("daily")
  async createDailyTickets(@Body() body: CreateDailyTicketDto) {
    return await this.ticketService.createDailyTickets(body);
  }

  @ApiOperation({ summary: "Get ticket pricing", description: "Get ticket pricing" })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: "Get ticket pricing" })
  @Get("pricing")
  async getPricing() {
    return await this.ticketService.getPricing();
  }

  @ApiOperation({ summary: "Update ticket pricing", description: "Update ticket pricing" })
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
  @Patch("pricing")
  async updatePricing(@Body() body: UpdateTicketPricingDto) {
    return await this.ticketService.updatePricing(body);
  }

  @ApiOperation({ summary: "Update a ticket", description: "Update a ticket" })
  @ApiParam({ name: "id", description: "Ticket id" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        type: { type: "string", example: "DAILY" },
        status: { type: "string", example: "AVAILABLE" }
      }
    }
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: "Ticket updated successfully" })
  @Patch(":id")
  async update(@Param("id") id: number, @Body() body: UpdateTicketDto) {
    return await this.ticketService.update(id, body);
  }

  @ApiOperation({ summary: "Delete a ticket", description: "Delete a ticket" })
  @ApiParam({ name: "id", description: "Ticket id" })
  @ApiBearerAuth()
  @ApiResponse({ status: 204, description: "Ticket deleted successfully" })
  @HttpCode(204)
  @Delete(":id")
  async delete(@Param("id") id: number) {
    return await this.ticketService.delete(id);
  }
}
