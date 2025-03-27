import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { DrizzleModule } from 'src/database/drizzle.module';
import { JwtModule } from '@nestjs/jwt';
import { MailService } from './mail.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, MailService],
  imports: [
    DrizzleModule,
    JwtModule
  ]
})
export class AuthModule { }
