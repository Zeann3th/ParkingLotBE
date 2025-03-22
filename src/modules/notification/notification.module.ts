import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { DrizzleModule } from 'src/database/drizzle.module';
import { NotificationController } from './notification.controller';
import { JwtStrategy } from 'src/strategies/jwt.strategy';
import { PassportModule } from '@nestjs/passport';

@Module({
  providers: [NotificationService, JwtStrategy],
  imports: [DrizzleModule, PassportModule],
  exports: [NotificationService],
  controllers: [NotificationController],
})
export class NotificationModule { }
