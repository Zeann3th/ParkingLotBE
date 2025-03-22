import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { User } from 'src/decorators/user.decorator';
import { UserInterface } from 'src/common/types';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { RolesGuard } from 'src/guards/role.guard';
import { Roles } from 'src/decorators/role.decorator';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "SECURITY", "USER")
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) { }

  @Get()
  async getAll(@User() user: UserInterface) {
    return await this.notificationService.getAll(user);
  }

  @Get(":id")
  async getById(@User() user: UserInterface, @Param("id") id: number) {
    return await this.notificationService.getById(user, id);
  }

  async create(@User() user: UserInterface, @Body() body: CreateNotificationDto) {
    return await this.notificationService.create(user, body);
  }

  @Patch(":id")
  async update(@User() user: UserInterface, @Param("id") id: number) {
    return await this.notificationService.update(user, id);
  }

  @Delete(":id")
  async delete(@User() user: UserInterface, @Param("id") id: number) {
    return await this.notificationService.delete(user, id);
  }
}
