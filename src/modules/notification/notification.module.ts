import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { DrizzleModule } from 'src/database/drizzle.module';

@Module({
  providers: [NotificationService],
  imports: [DrizzleModule]
})
export class NotificationModule { }
