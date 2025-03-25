import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { eq, inArray, lt } from 'drizzle-orm';
import { DRIZZLE } from 'src/database/drizzle.module';
import { userTickets, vehicleReservations } from 'src/database/schema';
import { DrizzleDB } from 'src/database/types/drizzle';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) { }

}
