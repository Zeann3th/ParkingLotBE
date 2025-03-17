import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { HealthcheckModule } from './healthcheck/healthcheck.module';
import { TransactionModule } from './transaction/transaction.module';
import { SectionModule } from './section/section.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HealthcheckModule,
    AuthModule,
    SectionModule,
    TransactionModule,
  ]
})
export class AppModule {
}
