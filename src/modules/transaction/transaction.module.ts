import { Module } from '@nestjs/common';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { DrizzleModule } from 'src/database/drizzle.module';
import { JwtStrategy } from 'src/strategies/jwt.strategy';
import { PassportModule } from '@nestjs/passport';

@Module({
  controllers: [TransactionController],
  providers: [TransactionService, JwtStrategy],
  imports: [DrizzleModule, PassportModule]
})
export class TransactionModule { }
