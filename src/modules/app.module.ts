import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { SectionModule } from './section/section.module';
import { FloorModule } from './floor/floor.module';
import { SlotModule } from './slot/slot.module';
import { HealthcheckModule } from './healthcheck/healthcheck.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HealthcheckModule,
    AuthModule,
    SectionModule,
    FloorModule,
    SlotModule
  ]
})
export class AppModule {
}
