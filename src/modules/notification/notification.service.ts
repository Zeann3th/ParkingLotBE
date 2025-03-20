import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from 'src/database/drizzle.module';
import { DrizzleDB } from 'src/database/types/drizzle';

@Injectable()
export class NotificationService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) { }

  async sendNotification(userId: number, message: string) {
  }
}
