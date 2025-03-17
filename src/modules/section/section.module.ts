import { Module } from '@nestjs/common';
import { DrizzleModule } from 'src/database/drizzle.module';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from 'src/strategies/jwt.strategy';
import { SectionController } from './section.controller';
import { SectionService } from './section.service';

@Module({
  controllers: [SectionController],
  providers: [SectionService, JwtStrategy],
  imports: [DrizzleModule, PassportModule]
})
export class SectionModule { }
