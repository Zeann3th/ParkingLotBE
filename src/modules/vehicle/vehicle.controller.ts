import { Body, Controller, DefaultValuePipe, Delete, Get, Headers, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { VehicleService } from './vehicle.service';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { RolesGuard } from 'src/guards/role.guard';
import { User } from 'src/decorators/user.decorator';
import { UserInterface } from 'src/common/types';
import { ApiBearerAuth, ApiBody, ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { Roles } from 'src/decorators/role.decorator';
import { CreateVehicleDto } from './dto/create-vehicle.dto';

@Controller('vehicles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) { }

  @ApiOperation({ summary: "Get all vehicles" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: "Returns all vehicles with their residence info (if exist)" })
  @Roles("ADMIN", "SECURITY")
  @Get()
  async getAll(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(10), ParseIntPipe) limit: number) {
    return await this.vehicleService.getAll(page, limit);
  }

  @ApiOperation({ summary: "Search vehicles by plate" })
  @ApiBearerAuth()
  @ApiQuery({ name: "plate", required: true, type: String })
  @ApiResponse({ status: 200, description: "Returns vehicles with their residence info (if exist)" })
  @Roles("ADMIN", "SECURITY")
  @Get("search")
  async search(@Query("plate") plate: string) {
    return await this.vehicleService.search(plate);
  }

  @ApiOperation({ summary: "Get vehicle by id" })
  @ApiParam({ name: "id", required: true, type: Number })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: "Returns vehicle with their residence info (if exist)" })
  @ApiResponse({ status: 403, description: "Not authorized to access this vehicle" })
  @Roles("ADMIN", "SECURITY", "USER")
  @Get(":id")
  async getById(@User() user: UserInterface, @Param("id", ParseIntPipe) id: number) {
    return await this.vehicleService.getById(user, id);
  }

  @ApiOperation({ summary: "Create/Register a vehicle" })
  @ApiBearerAuth()
  @ApiBody({
    type: "object",
    schema: {
      properties: {
        plate: { type: "string", example: "ABC1234" },
        type: { type: "string", example: "CAR" },
      },
      required: ["plate"],
    }
  })
  @ApiResponse({ status: 200, description: "Vehicle created successfully" })
  @ApiResponse({ status: 409, description: "Vehicle's plate already exists" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  @Roles("ADMIN", "SECURITY")
  @Post()
  async create(@Body() body: CreateVehicleDto) {
    return await this.vehicleService.create(body);
  }

  @ApiOperation({ summary: "Update vehicle" })
  @ApiParam({ name: "id", required: true, type: Number })
  @ApiBearerAuth()
  @Roles("ADMIN")
  @Patch(":id")
  async update(@Param("id", ParseIntPipe) id: number, @Body("plate") plate: string) {
    return await this.vehicleService.update(id, plate);
  }

  @ApiOperation({ summary: "Delete vehicle" })
  @ApiParam({ name: "id", required: true, type: Number })
  @ApiBearerAuth()
  @Roles("ADMIN")
  @Delete(":id")
  async delete(@Param("id", ParseIntPipe) id: number) {
    return await this.vehicleService.delete(id);
  }
}
