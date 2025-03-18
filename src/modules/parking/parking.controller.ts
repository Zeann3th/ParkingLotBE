import { Controller, Get, Post } from '@nestjs/common';
import { ParkingService } from './parking.service';

@Controller('parking')
export class ParkingController {
  constructor(private readonly parkingService: ParkingService) { }

  @Post("check-in")
  async checkIn() {
    return await this.parkingService.checkIn();
  }

  @Post("check-out")
  async checkOut() {
    return await this.parkingService.checkOut();
  }

  @Get("available-slots")
  async getAvailableSlots() {
    return await this.parkingService.getAvailableSlots();
  }

  @Get("history")
  async getHistory() {

  }
}
