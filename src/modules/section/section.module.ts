import { Module } from '@nestjs/common';
import { SectionController } from './section.controller';
import { SectionService } from './section.service';
import { DrizzleModule } from 'src/database/drizzle.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  controllers: [SectionController],
  providers: [SectionService],
  imports: [DrizzleModule, JwtModule]
})
export class SectionModule { }
