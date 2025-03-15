import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { SectionModule } from './section/section.module';
import { FloorModule } from './floor/floor.module';
import { SlotModule } from './slot/slot.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    SectionModule,
    FloorModule,
    SlotModule
  ]
})
export class AppModule {
}
