import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { RolesGuard } from 'src/guards/role.guard';
import { Roles } from 'src/decorators/role.decorator';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

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

  @ApiOperation({ summary: "Create a new ticket", description: "Create a new ticket" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        ticketType: { type: "string", example: "DAILY" },
        price: { type: "number", example: 100 },
        validTo: { type: "string", example: "2022-12-31" }
      }
    }
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: "Ticket created successfully" })
  @Post()
  async create(@Body() body: CreateTicketDto) {
    return await this.ticketService.create(body);
  }

  @ApiOperation({ summary: "Update a ticket", description: "Update a ticket" })
  @ApiParam({ name: "id", description: "Ticket id" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        ticketType: { type: "string", example: "DAILY" },
        price: { type: "number", example: 100 },
        validTo: { type: "string", example: "2022-12-31" }
      }
    }
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: "Ticket updated successfully" })
  @Patch(":id")
  async update(@Param("id") id: number, body: UpdateTicketDto) {
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
