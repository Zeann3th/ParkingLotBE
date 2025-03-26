import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { VehicleService } from './vehicle.service';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { RolesGuard } from 'src/guards/role.guard';
import { User } from 'src/decorators/user.decorator';
import { UserInterface } from 'src/common/types';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Roles } from 'src/decorators/role.decorator';
import { CreateVehicleDto } from './dto/create-vehicle.dto';

@Controller('vehicles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) { }

  @ApiOperation({ summary: "Get all vehicles" })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: "Returns all vehicles with their residence info (if exist)" })
  @Roles("ADMIN", "SECURITY")
  @Get()
  async getAll(@User() user: UserInterface) {
    return this.vehicleService.getAll(user);
  }

  @ApiOperation({ summary: "Get vehicle by id" })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: "Returns vehicle witj their residence info (if exist)" })
  @ApiResponse({ status: 403, description: "Not authorized to access this vehicle" })
  @Roles("ADMIN", "SECURITY")
  @Get(":id")
  async getById(@User() user: UserInterface, @Param("id", ParseIntPipe) id: number) {
    return this.vehicleService.getById(user, id);
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
