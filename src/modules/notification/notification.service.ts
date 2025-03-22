import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from 'src/database/drizzle.module';
import { notifications } from 'src/database/schema';
import { DrizzleDB } from 'src/database/types/drizzle';

@Injectable()
export class NotificationService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) { }

  async sendNotification(from: number, to: number, message: string) {
    return await this.db.insert(notifications).values({ from, to, message }).returning();
  }
}
