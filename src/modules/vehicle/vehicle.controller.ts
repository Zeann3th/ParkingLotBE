import { Body, Controller, Delete, Get, Headers, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { VehicleService } from './vehicle.service';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { RolesGuard } from 'src/guards/role.guard';
import { User } from 'src/decorators/user.decorator';
import { UserInterface } from 'src/common/types';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Roles } from 'src/decorators/role.decorator';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Controller('vehicles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VehicleController {
  constructor(
    private readonly vehicleService: VehicleService,
    @InjectRedis() private readonly redis: Redis
  ) { }

  @ApiOperation({ summary: "Get all vehicles" })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: "Returns all vehicles with their residence info (if exist)" })
  @Roles("ADMIN", "SECURITY")
  @Get()
  async getAll(
    @Headers("Cache-Control") cacheOption: string,
    @User() user: UserInterface,
    @Query("plate") plate: string,
    @Query("page", ParseIntPipe) page: number,
    @Query("limit", ParseIntPipe) limit: number) {
    const key = `vehicles:${page}:${limit}`;
    if (cacheOption && cacheOption !== "no-cache") {
      const cachedVehicles = await this.redis.get(key);
      if (cachedVehicles) {
        return JSON.parse(cachedVehicles);
      }
    }
    const vehicles = await this.vehicleService.getAll(user, plate, page, limit);
    await this.redis.set(key, JSON.stringify(vehicles), "EX", 60 * 15);
    return vehicles;
  }

  @ApiOperation({ summary: "Get vehicle by id" })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: "Returns vehicle witj their residence info (if exist)" })
  @ApiResponse({ status: 403, description: "Not authorized to access this vehicle" })
  @Roles("ADMIN", "SECURITY")
  @Get(":id")
  async getById(
    @Headers("Cache-Control") cacheOption: string,
    @User() user: UserInterface,
    @Param("id", ParseIntPipe) id: number) {
    const key = `vehicles:${id}`;
    if (cacheOption && cacheOption !== "no-cache") {
      const cachedVehicle = await this.redis.get(key);
      if (cachedVehicle) {
        return JSON.parse(cachedVehicle);
      }
    }
    const vehicle = await this.vehicleService.getById(user, id);
    await this.redis.set(key, JSON.stringify(vehicle), "EX", 60 * 15);
    return vehicle;
  }

  @ApiOperation({ summary: "Create/Register a vehicle" })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: "Vehicle created successfully" })
  @ApiResponse({ status: 409, description: "Vehicle's plate already exists" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  @Roles("ADMIN", "SECURITY")
  @Post()
  async create(@Body() body: CreateVehicleDto) {
    return this.vehicleService.create(body);
  }

  @ApiOperation({ summary: "Update vehicle" })
  @ApiBearerAuth()
  @Roles("ADMIN")
  @Patch(":id")
  async update(@Param("id", ParseIntPipe) id: number, @Body("plate") plate: string) {
    return this.vehicleService.update(id, plate);
  }

  @ApiBearerAuth()
  @Roles("ADMIN")
  @Delete(":id")
  async delete(@Param("id", ParseIntPipe) id: number) {
    return this.vehicleService.delete(id);
  }
}
