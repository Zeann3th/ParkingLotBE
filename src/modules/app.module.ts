import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { HealthcheckModule } from './healthcheck/healthcheck.module';
import { SectionModule } from './section/section.module';
import { ParkingModule } from './parking/parking.module';
import { TicketModule } from './ticket/ticket.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HealthcheckModule,
    AuthModule,
    SectionModule,
    ParkingModule,
    TicketModule,
  ]
})
export class AppModule {
}
