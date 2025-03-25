import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { VehicleService } from './vehicle.service';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { RolesGuard } from 'src/guards/role.guard';

@Controller('vehicle')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) { }

  @Get()
  async getAll() {
    return this.vehicleService.getAll();
  }

  @Get(":id")
  async getById(@Param("id", ParseIntPipe) id: number) {
    return this.vehicleService.getById(id);
  }

  @Post()
  async create(@Body() body: any) {
    return this.vehicleService.create(body);
  }

  @Patch(":id")
  async update(@Param("id", ParseIntPipe) id: number, @Body("plate") plate: string) {
    return this.vehicleService.update(id, plate);
  }

  @Delete(":id")
  async delete(@Param("id", ParseIntPipe) id: number) {
    return this.vehicleService.delete(id);
  }
}
