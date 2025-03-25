import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ResidenceService } from './residence.service';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { RolesGuard } from 'src/guards/role.guard';
import { Roles } from 'src/decorators/role.decorator';
import { CreateResidenceDto } from './dto/create-residence.dto';
import { UpdateResidenceDto } from './dto/update-residence.dto';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

@Controller('residences')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
export class ResidenceController {
  constructor(private readonly residenceService: ResidenceService) { }

  @ApiOperation({ summary: "Get all residences" })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: "Return all residences" })
  @Get()
  async getAll() {
    return await this.residenceService.getAll();
  }

  @ApiOperation({ summary: "Get residence by id" })
  @ApiParam({ name: "id", required: true })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: "Return residence by id" })
  @Get(":id")
  async getById(@Param("id") id: number) {
    return await this.residenceService.getById(id);
  }

  @ApiOperation({ summary: "Create residence" })
  @ApiBody({
    type: "object",
    schema: {
      properties: {
        building: { type: "string", example: "A" },
        room: { type: "string", example: "101" }
      },
      required: ["building", "room"]
    }
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: "Residence created" })
  @Post()
  async create(@Body() body: CreateResidenceDto) {
    return await this.residenceService.create(body);
  }

  @ApiOperation({ summary: "Update residence" })
  @ApiParam({ name: "id", required: true })
  @ApiBody({
    type: "object",
    schema: {
      properties: {
        building: { type: "string", example: "A" },
        room: { type: "string", example: "101" }
      },
      required: []
    }
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: "Residence updated" })
  @ApiResponse({ status: 400, description: "No fields to update" })
  @ApiResponse({ status: 404, description: "Residence not found" })
  @Patch(":id")
  async update(@Param("id") id: number, @Body() body: UpdateResidenceDto) {
    return await this.residenceService.update(id, body)
  }

  @ApiOperation({ summary: "Add resident to residence" })
  @ApiParam({ name: "id", required: true })
  @ApiBody({
    type: "object",
    schema: {
      properties: {
        userId: { type: "number", example: 1 }
      },
      required: ["userId"]
    }
  })
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiResponse({ status: 200, description: "User ${userId} added to residence ${id}" })
  @ApiResponse({ status: 404, description: "Residence not found" })
  @ApiResponse({ status: 404, description: "User not found" })
  @Post(":id/residents")
  async addResident(@Param("id") id: number, @Body("userId") userId: number) {
    return await this.residenceService.addResident(id, userId);
  }

  @ApiOperation({ summary: "Remove resident from residence" })
  @ApiParam({ name: "id", required: true })
  @ApiBody({
    type: "object",
    schema: {
      properties: {
        userId: { type: "number", example: 1 }
      },
      required: ["userId"]
    }
  })
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiResponse({ status: 200, description: "User ${userId} removed from residence ${id}" })
  @ApiResponse({ status: 404, description: "Residence not found" })
  @ApiResponse({ status: 404, description: "User not found" })
  @ApiResponse({ status: 404, description: "User not found in residence" })
  @Delete(":id/residents")
  async removeResident(@Param("id") id: number, @Body("userId") userId: number) {
    return await this.residenceService.removeResident(id, userId);
  }

  @ApiOperation({ summary: "Add vehicle to residence" })
  @ApiParam({ name: "id", required: true })
  @ApiBody({
    type: "object",
    schema: {
      properties: {
        vehicleId: { type: "number", example: 1 }
      },
      required: ["vehicleId"]
    }
  })
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiResponse({ status: 200, description: "Vehicle ${vehicleId} added to residence ${id}" })
  @ApiResponse({ status: 404, description: "Residence not found" })
  @ApiResponse({ status: 404, description: "Vehicle not found" })
  @Post(":id/vehicles")
  async addVehicle(@Param("id") id: number, @Body("vehicleId") vehicleId: number) {
    return await this.residenceService.addVehicle(id, vehicleId);
  }

  @ApiOperation({ summary: "Remove vehicle from residence" })
  @ApiParam({ name: "id", required: true })
  @ApiBody({
    type: "object",
    schema: {
      properties: {
        vehicleId: { type: "number", example: 1 }
      },
      required: ["vehicleId"]
    }
  })
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiResponse({ status: 200, description: "Vehicle ${vehicleId} removed from residence ${id}" })
  @ApiResponse({ status: 404, description: "Residence not found" })
  @ApiResponse({ status: 404, description: "Vehicle not found" })
  @ApiResponse({ status: 404, description: "Vehicle not found in residence" })
  @Delete(":id/vehicles")
  async removeVehicle(@Param("id") id: number, @Body("vehicleId") vehicleId: number) {
    return await this.residenceService.removeVehicle(id, vehicleId);
  }

  @ApiOperation({ summary: "Delete residence" })
  @ApiParam({ name: "id", required: true })
  @ApiBearerAuth()
  @HttpCode(204)
  @ApiResponse({ status: 204, description: "Residence deleted" })
  @ApiResponse({ status: 404, description: "Residence not found" })
  @Delete(":id")
  async delete(@Param("id") id: number) {
    return await this.residenceService.delete(id);
  }
}
