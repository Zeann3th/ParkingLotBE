import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ParkingService } from './parking.service';
import { CheckInDto } from './dto/check-in.dto';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { RolesGuard } from 'src/guards/role.guard';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CheckOutDto } from './dto/check-out.dto';
import { Roles } from 'src/decorators/role.decorator';
import { User } from 'src/decorators/user.decorator';
import { UserInterface } from 'src/common/types';

@Controller('parking')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "SECURITY")
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
  @ApiResponse({ status: 403, description: "You are not allowed to operate on this section" })
  @ApiBearerAuth()
  @Post("check-in")
  async checkIn(@User() user: UserInterface, @Body() body: CheckInDto) {
    return await this.parkingService.checkIn(user, body);
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
  @ApiResponse({ status: 404, description: "Ticket not found" })
  @ApiResponse({ status: 400, description: "No available parking slots for this section" })
  @ApiBearerAuth()
  @Post("check-out")
  async checkOut(@User() user: UserInterface, @Body() body: CheckOutDto) {
    return await this.parkingService.checkOut(user, body);
  }

  @ApiBearerAuth()
  @Get("history")
  async getHistory() {

  }
}
