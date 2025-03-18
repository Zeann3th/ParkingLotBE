import { Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { ParkingService } from './parking.service';
import { CheckInDto } from './dto/check-in.dto';
import { CustomRequest } from 'src/config/dto/request.dto';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { RolesGuard } from 'src/guards/role.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('parking')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ParkingController {
  constructor(private readonly parkingService: ParkingService) { }

  @ApiBearerAuth()
  @Post("check-in")
  async checkIn(@Request() req: CustomRequest, body: CheckInDto) {
    return await this.parkingService.checkIn(req.user, body);
  }

  @ApiBearerAuth()
  @Post("check-out")
  async checkOut(body: any) {
    return await this.parkingService.checkOut();
  }

  @ApiBearerAuth()
  @Get("history")
  async getHistory() {

  }
}
