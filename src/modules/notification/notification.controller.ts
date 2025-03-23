import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { User } from 'src/decorators/user.decorator';
import { UserInterface } from 'src/common/types';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { RolesGuard } from 'src/guards/role.guard';
import { Roles } from 'src/decorators/role.decorator';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "SECURITY", "USER")
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) { }

  @ApiOperation({ summary: "Get all notifications" })
  @ApiResponse({ status: 200, description: "Return all notifications" })
  @Get()
  async getAll(@User() user: UserInterface) {
    return await this.notificationService.getAll(user);
  }

  @ApiOperation({ summary: "Get notification by id" })
  @ApiParam({ name: "id", required: true })
  @ApiResponse({ status: 200, description: "Return notification by id" })
  @Get(":id")
  async getById(@User() user: UserInterface, @Param("id") id: number) {
    return await this.notificationService.getById(user, id);
  }

  @ApiOperation({ summary: "Create notification" })
  @ApiResponse({ status: 200, description: "Return created notification" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        to: { type: "integer" },
        message: { type: "string" }
      },
      required: ["to", "message"]
    }
  })
  @Post()
  async create(@User() user: UserInterface, @Body() body: CreateNotificationDto) {
    return await this.notificationService.create(user, body);
  }

  @ApiOperation({ summary: "Update notification" })
  @ApiParam({ name: "id", required: true })
  @ApiResponse({ status: 200, description: "Return updated notification" })
  @Patch(":id")
  async update(@User() user: UserInterface, @Param("id") id: number) {
    return await this.notificationService.update(user, id);
  }

  @ApiOperation({ summary: "Delete notification" })
  @ApiParam({ name: "id", required: true })
  @ApiResponse({ status: 204, description: "Success" })
  @HttpCode(204)
  @Delete(":id")
  async delete(@User() user: UserInterface, @Param("id") id: number) {
    return await this.notificationService.delete(user, id);
  }
}
