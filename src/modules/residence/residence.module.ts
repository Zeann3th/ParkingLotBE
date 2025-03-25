import { Module } from '@nestjs/common';
import { ResidenceController } from './residence.controller';
import { ResidenceService } from './residence.service';
import { DrizzleModule } from 'src/database/drizzle.module';
import { JwtStrategy } from 'src/strategies/jwt.strategy';
import { PassportModule } from '@nestjs/passport';

@Module({
  controllers: [ResidenceController],
  providers: [ResidenceService, JwtStrategy],
  imports: [DrizzleModule, PassportModule]
})
export class ResidenceModule { }
