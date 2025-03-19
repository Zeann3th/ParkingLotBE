import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { ParkingService } from './parking.service';
import { CheckInDto } from './dto/check-in.dto';
import { CustomRequest } from 'src/config/dto/request.dto';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { RolesGuard } from 'src/guards/role.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CheckOutDto } from './dto/check-out.dto';

@Controller('parking')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ParkingController {
  constructor(private readonly parkingService: ParkingService) { }

  @ApiBearerAuth()
  @Post("check-in")
  async checkIn(@Request() req: CustomRequest, @Body() body: CheckInDto) {
    return await this.parkingService.checkIn(req.user, body);
  }

  @ApiBearerAuth()
  @Post("check-out")
  async checkOut(@Body() body: CheckOutDto) {
    return await this.parkingService.checkOut(body);
  }

  @ApiBearerAuth()
  @Get("history")
  async getHistory() {

  }
}
