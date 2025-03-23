import { Module } from '@nestjs/common';
import { CronService } from './cron.service';
import { DrizzleModule } from 'src/database/drizzle.module';

@Module({
  imports: [DrizzleModule],
  providers: [CronService]
})
export class CronModule { }
