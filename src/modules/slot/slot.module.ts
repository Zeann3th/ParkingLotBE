import { Module } from '@nestjs/common';
import { SlotController } from './slot.controller';
import { SlotService } from './slot.service';
import { DrizzleModule } from 'src/database/drizzle.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  controllers: [SlotController],
  providers: [SlotService],
  imports: [DrizzleModule, JwtModule]
})
export class SlotModule { }
