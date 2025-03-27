import { Module } from '@nestjs/common';
import { VehicleController } from './vehicle.controller';
import { VehicleService } from './vehicle.service';
import { JwtStrategy } from 'src/strategies/jwt.strategy';
import { DrizzleModule } from 'src/database/drizzle.module';
import { PassportModule } from '@nestjs/passport';

@Module({
  controllers: [VehicleController],
  providers: [VehicleService, JwtStrategy],
  imports: [DrizzleModule, PassportModule]
})
export class VehicleModule { }
