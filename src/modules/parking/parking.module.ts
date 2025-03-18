import { Module } from '@nestjs/common';
import { ParkingController } from './parking.controller';
import { ParkingService } from './parking.service';
import { JwtStrategy } from 'src/strategies/jwt.strategy';
import { DrizzleModule } from 'src/database/drizzle.module';
import { PassportModule } from '@nestjs/passport';

@Module({
  controllers: [ParkingController],
  providers: [ParkingService, JwtStrategy],
  imports: [DrizzleModule, PassportModule]
})
export class ParkingModule { }
