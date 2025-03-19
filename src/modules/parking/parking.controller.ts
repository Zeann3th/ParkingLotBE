import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { ParkingService } from './parking.service';
import { CheckInDto } from './dto/check-in.dto';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { RolesGuard } from 'src/guards/role.guard';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CheckOutDto } from './dto/check-out.dto';

@Controller('parking')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ParkingController {
  constructor(private readonly parkingService: ParkingService) { }

  @ApiOperation({ summary: "Check in", description: "Check in" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        sectionId: { type: "number", example: 1 },
        ticketId: { type: "number", example: 1 },
        plate: { type: "string", example: "1234" },
        type: { type: "string", example: "CAR" }
      }
    }
  })
  @ApiResponse({ status: 201, description: "Success" })
  @ApiBearerAuth()
  @Post("check-in")
  async checkIn(@Request() req, @Body() body: CheckInDto) {
    return await this.parkingService.checkIn(req.user, body);
  }

  @ApiOperation({ summary: "Check out", description: "Check out" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        ticketId: { type: "number", example: 1 }
      }
    }
  })
  @ApiResponse({ status: 201, description: "Success" })
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
