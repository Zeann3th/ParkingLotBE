import { Module } from '@nestjs/common';
import { TicketController } from './ticket.controller';
import { TicketService } from './ticket.service';
import { JwtStrategy } from 'src/strategies/jwt.strategy';
import { DrizzleModule } from 'src/database/drizzle.module';
import { PassportModule } from '@nestjs/passport';

@Module({
  controllers: [TicketController],
  providers: [TicketService, JwtStrategy],
  imports: [DrizzleModule, PassportModule]
})
export class TicketModule { }
