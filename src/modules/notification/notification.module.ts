import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { DrizzleModule } from 'src/database/drizzle.module';
import { NotificationController } from './notification.controller';

@Module({
  providers: [NotificationService],
  imports: [DrizzleModule],
  exports: [NotificationService],
  controllers: [NotificationController],
})
export class NotificationModule { }
