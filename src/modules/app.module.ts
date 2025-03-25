import env from 'src/common';
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
import { VehicleModule } from './vehicle/vehicle.module';
import { RedisModule } from '@nestjs-modules/ioredis';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    RedisModule.forRoot({
      type: "single",
      url: env.CACHE_URL
    }),
    HealthcheckModule,
    AuthModule, // DONE
    SectionModule, // DONE
    ParkingModule, // DONE
    TicketModule, // DONE    
    NotificationModule, // DONE
    CronModule, // no transactions yet
    ResidenceModule, // RBAC Crisis
    VehicleModule, // RBAC Crisis
  ],
})
export class AppModule {
}
