import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
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
export class ParkingController {
  constructor(private readonly parkingService: ParkingService) { }

  @ApiOperation({ summary: "Check in" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        sectionId: { type: "number", example: 1 },
        ticketId: { type: "number", example: 1 },
        plate: { type: "string", example: "1234" },
        type: { type: "string", example: "CAR" }
      },
      required: ["sectionId", "ticketId", "plate", "type"]
    }
  })
  @ApiResponse({ status: 201, description: "Success" })
  @ApiResponse({ status: 403, description: "You are not allowed to operate on this section" })
  @ApiResponse({ status: 404, description: "Ticket not found" })
  @ApiResponse({ status: 400, description: "Ticket is not available" })
  @ApiResponse({ status: 400, description: "Plate does not match" })
  @ApiResponse({ status: 400, description: "Invalid ticket" })
  @ApiResponse({ status: 400, description: "Section is full" })
  @ApiBearerAuth()
  @Roles("ADMIN", "SECURITY")
  @Post("check-in")
  async checkIn(@User() user: UserInterface, @Body() body: CheckInDto) {
    return await this.parkingService.checkIn(user, body);
  }

  @ApiOperation({ summary: "Check out" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        sectionId: { type: "number", example: 1 },
        ticketId: { type: "number", example: 1 },
        plate: { type: "string", example: "1234" }
      },
      required: ["sectionId", "ticketId", "plate"]
    }
  })
  @ApiResponse({ status: 200, description: "Success" })
  @ApiResponse({ status: 404, description: "Ticket not found" })
  @ApiResponse({ status: 400, description: "No available parking slots for this section" })
  @ApiResponse({ status: 400, description: "Ticket is not in use" })
  @ApiResponse({ status: 404, description: "Session not found" })
  @ApiResponse({ status: 404, description: "Vehicle not found" })
  @ApiResponse({ status: 400, description: "Plate does not match" })
  @ApiResponse({ status: 404, description: "User ticket not found" })
  @HttpCode(200)
  @ApiBearerAuth()
  @Roles("ADMIN", "SECURITY")
  @Post("check-out")
  async checkOut(@User() user: UserInterface, @Body() body: CheckOutDto) {
    return await this.parkingService.checkOut(user, body);
  }
}
