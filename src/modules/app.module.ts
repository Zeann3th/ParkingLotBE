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
import { ResidenceModule } from './residence/residence.module';
import { VehicleModule } from './vehicle/vehicle.module';
import { RedisModule } from '@nestjs-modules/ioredis';
import { TransactionModule } from './transaction/transaction.module';
import { minutes, ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    RedisModule.forRoot({
      type: "single",
      url: env.CACHE_URL
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: minutes(15),
          limit: 500,
        }
      ]
    }),
    HealthcheckModule,
    AuthModule,
    SectionModule,
    ParkingModule,
    TicketModule,
    NotificationModule,
    ResidenceModule, //TODO: Get residences' users and vehicles 
    VehicleModule,
    TransactionModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    }
  ]
})
export class AppModule {
}
