import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { DrizzleModule } from 'src/database/drizzle.module';
import { JwtModule } from '@nestjs/jwt';
import env from 'src/config';

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  imports: [
    DrizzleModule,
    JwtModule
  ]
})
export class AuthModule { }
