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

  @Cron('0 0 0 * * *')
  async validateReservation() {
    const reserved = await this.db.select({ ticketId: vehicleReservations.ticketId }).from(vehicleReservations)
      .leftJoin(userTickets, eq(vehicleReservations.ticketId, userTickets.ticketId))
      .where(lt(userTickets.validTo, (new Date()).toISOString()))

    const reservedCount = reserved.length;
    this.logger.log(`Found ${reservedCount} expired reservations`);

    if (reservedCount === 0) {
      return;
    }

    const reservedIds = reserved.map(r => r.ticketId);

    await this.db.delete(vehicleReservations)
      .where(inArray(vehicleReservations.ticketId, reservedIds));
    this.logger.log(`Deleted ${reservedCount} expired reservations`);
    return;
  }
}
