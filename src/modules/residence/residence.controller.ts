import { Body, Controller, Delete, Get, Headers, HttpCode, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ResidenceService } from './residence.service';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { RolesGuard } from 'src/guards/role.guard';
import { Roles } from 'src/decorators/role.decorator';
import { CreateResidenceDto } from './dto/create-residence.dto';
import { UpdateResidenceDto } from './dto/update-residence.dto';
import { ApiBearerAuth, ApiBody, ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { User } from 'src/decorators/user.decorator';
import { UserInterface } from 'src/common/types';
import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';

@Controller('residences')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ResidenceController {
  constructor(
    private readonly residenceService: ResidenceService,
    @InjectRedis() private readonly redis: Redis
  ) { }

  @ApiOperation({ summary: "Get all residences" })
  @ApiHeader({
    name: "Cache-Control",
    required: false,
    description: "no-cache to ignore cache"
  })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: "Return all residences" })
  @Roles("ADMIN", "SECURITY", "USER")
  @Get()
  async getAll(
    @Headers("Cache-Control") cacheOption: string,
    @User() user: UserInterface,
    @Query("page", ParseIntPipe) page: number,
    @Query("limit", ParseIntPipe) limit: number
  ) {
    const key = user.role === "ADMIN" ? `residences:${page}:${limit}` : `residences:${user.sub}:${page}:${limit}`;
    if (cacheOption && cacheOption !== "no-cache") {
      const cachedResidences = await this.redis.get(key);
      if (cachedResidences) {
        return JSON.parse(cachedResidences);
      }
    }
    const residences = await this.residenceService.getAll(user, page, limit);
    await this.redis.set(key, JSON.stringify(residences), "EX", 60 * 10);
    return residences;
  }

  @ApiOperation({ summary: "Get residence by id" })
  @ApiParam({ name: "id", required: true })
  @ApiHeader({
    name: "Cache-Control",
    required: false,
    description: "no-cache to ignore cache"
  })
  @ApiResponse({ status: 200, description: "Return residence" })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: "Return residence by id" })
  @Roles("ADMIN", "SECURITY", "USER")
  @Get(":id")
  async getById(
    @Headers("Cache-Control") cacheOption: string,
    @User() user: UserInterface,
    @Param("id", ParseIntPipe) id: number
  ) {
    const key = user.role === "ADMIN" ? `residences:${id}` : `residences:${user.sub}:${id}`;
    if (cacheOption && cacheOption !== "no-cache") {
      const cachedResidence = await this.redis.get(key);
      if (cachedResidence) {
        return JSON.parse(cachedResidence);
      }
    }
    const residence = await this.residenceService.getById(user, id);
    await this.redis.set(key, JSON.stringify(residence), "EX", 60 * 10);
    return residence;
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
  @Roles("ADMIN")
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
  @Roles("ADMIN")
  @Patch(":id")
  async update(@Param("id", ParseIntPipe) id: number, @Body() body: UpdateResidenceDto) {
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
  @Roles("ADMIN")
  @Post(":id/residents")
  async addResident(@Param("id", ParseIntPipe) id: number, @Body("userId", ParseIntPipe) userId: number) {
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
  @Roles("ADMIN")
  @Delete(":id/residents")
  async removeResident(@Param("id", ParseIntPipe) id: number, @Body("userId", ParseIntPipe) userId: number) {
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
  @Roles("ADMIN")
  @Post(":id/vehicles")
  async addVehicle(@Param("id", ParseIntPipe) id: number, @Body("vehicleId", ParseIntPipe) vehicleId: number) {
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
  @Roles("ADMIN")
  @Delete(":id/vehicles")
  async removeVehicle(@Param("id", ParseIntPipe) id: number, @Body("vehicleId", ParseIntPipe) vehicleId: number) {
    return await this.residenceService.removeVehicle(id, vehicleId);
  }

  @ApiOperation({ summary: "Delete residence" })
  @ApiParam({ name: "id", required: true })
  @ApiBearerAuth()
  @HttpCode(204)
  @ApiResponse({ status: 204, description: "Residence deleted" })
  @ApiResponse({ status: 404, description: "Residence not found" })
  @Roles("ADMIN")
  @Delete(":id")
  async delete(@Param("id", ParseIntPipe) id: number) {
    return await this.residenceService.delete(id);
  }
}
