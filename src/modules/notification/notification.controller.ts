import { Body, Controller, Delete, Get, Headers, HttpCode, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { User } from 'src/decorators/user.decorator';
import { UserInterface } from 'src/common/types';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { RolesGuard } from 'src/guards/role.guard';
import { Roles } from 'src/decorators/role.decorator';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    @InjectRedis() private readonly redis: Redis
  ) { }

  @ApiOperation({ summary: "Get all notifications" })
  @ApiResponse({ status: 200, description: "Return all notifications" })
  @ApiBearerAuth()
  @Roles("ADMIN", "SECURITY", "USER")
  @Get()
  async getAll(
    @Headers("Cache-Control") cacheOption: string,
    @User() user: UserInterface,
    @Query("page", ParseIntPipe) page: number,
    @Query("limit", ParseIntPipe) limit: number
  ) {
    const key = user.role === "ADMIN" ? `notifications` : `notifications:${user.sub}`;
    if (cacheOption && cacheOption !== "no-cache") {
      const cachedNotifications = await this.redis.get(key);
      if (cachedNotifications) {
        return JSON.parse(cachedNotifications);
      }
    }
    const notifications = await this.notificationService.getAll(user, page, limit);
    await this.redis.set(key, JSON.stringify(notifications), "EX", 60 * 15);
    return notifications;
  }

  @ApiOperation({ summary: "Get notification by id" })
  @ApiParam({ name: "id", required: true })
  @ApiResponse({ status: 200, description: "Return notification by id" })
  @ApiBearerAuth()
  @Roles("ADMIN", "SECURITY", "USER")
  @Get(":id")
  async getById(
    @Headers("Cache-Control") cacheOption: string,
    @User() user: UserInterface,
    @Param("id", ParseIntPipe) id: number
  ) {
    const key = user.role === "ADMIN" ? `notifications:${id}` : `notifications:${user.sub}:${id}`;
    if (cacheOption && cacheOption !== "no-cache") {
      const cachedNotification = await this.redis.get(key);
      if (cachedNotification) {
        return JSON.parse(cachedNotification);
      }
    }
    const notification = await this.notificationService.getById(user, id);
    await this.redis.set(key, JSON.stringify(notification), "EX", 60 * 15);
    return notification;
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
      required: ["message"]
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
  async update(@User() user: UserInterface, @Param("id", ParseIntPipe) id: number, @Body("action") action: string) {
    return await this.notificationService.update(user, id, action);
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
