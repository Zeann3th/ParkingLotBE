import { Module } from '@nestjs/common';
import { FloorController } from './floor.controller';
import { FloorService } from './floor.service';
import { DrizzleModule } from 'src/database/drizzle.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  controllers: [FloorController],
  providers: [FloorService],
  imports: [DrizzleModule, JwtModule]
})
export class FloorModule { }
