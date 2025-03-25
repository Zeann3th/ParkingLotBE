import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { HealthcheckModule } from './healthcheck/healthcheck.module';
import { SectionModule } from './section/section.module';
import { ParkingModule } from './parking/parking.module';
import { TicketModule } from './ticket/ticket.module';
import { NotificationModule } from './notification/notification.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CronModule } from './cron/cron.module';
import { ResidenceModule } from './residence/residence.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    HealthcheckModule,
    AuthModule,
    SectionModule,
    ParkingModule,
    TicketModule,
    NotificationModule,
    CronModule,
    ResidenceModule,
  ],
})
export class AppModule {
}

//TODO: Vehicle module
