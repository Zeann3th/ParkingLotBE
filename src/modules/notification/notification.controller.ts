import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { User } from 'src/decorators/user.decorator';
import { UserInterface } from 'src/common/types';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { RolesGuard } from 'src/guards/role.guard';
import { Roles } from 'src/decorators/role.decorator';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) { }

  @ApiOperation({ summary: "Get all notifications" })
  @ApiResponse({ status: 200, description: "Return all notifications" })
  @ApiBearerAuth()
  @Roles("ADMIN", "SECURITY", "USER")
  @Get()
  async getAll(@User() user: UserInterface) {
    return await this.notificationService.getAll(user);
  }

  @ApiOperation({ summary: "Get notification by id" })
  @ApiParam({ name: "id", required: true })
  @ApiResponse({ status: 200, description: "Return notification by id" })
  @ApiBearerAuth()
  @Roles("ADMIN", "SECURITY", "USER")
  @Get(":id")
  async getById(@User() user: UserInterface, @Param("id", ParseIntPipe) id: number) {
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
  @ApiBearerAuth()
  @Roles("ADMIN", "SECURITY", "USER")
  @Post()
  async create(@User() user: UserInterface, @Body() body: CreateNotificationDto) {
    return await this.notificationService.create(user, body);
  }

  @ApiOperation({ summary: "Update notification" })
  @ApiParam({ name: "id", required: true })
  @ApiResponse({ status: 200, description: "Return updated notification" })
  @ApiBearerAuth()
  @Roles("ADMIN", "SECURITY", "USER")
  @Patch(":id")
  async read(@User() user: UserInterface, @Param("id", ParseIntPipe) id: number, @Body("action") action: string) {
    return await this.notificationService.read(user, id, action);
  }

  @ApiOperation({ summary: "Delete notification" })
  @ApiParam({ name: "id", required: true })
  @ApiResponse({ status: 204, description: "Success" })
  @HttpCode(204)
  @ApiBearerAuth()
  @Roles("ADMIN")
  @Delete(":id")
  async delete(@Param("id", ParseIntPipe) id: number) {
    return await this.notificationService.delete(id);
  }
}
