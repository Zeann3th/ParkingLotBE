import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { UserInterface } from 'src/common/types';
import { DRIZZLE } from 'src/database/drizzle.module';
import { notifications, users } from 'src/database/schema';
import { DrizzleDB } from 'src/database/types/drizzle';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) { }

  async getAll(user: UserInterface) {
    return await this.db.select().from(notifications)
      .where(eq(notifications.to, user.sub));
  }

  async getById(user: UserInterface, id: number) {
    const [notification] = await this.db.select().from(notifications)
      .where(and(
        eq(notifications.id, id),
        eq(notifications.to, user.sub)
      ));
    return notification;
  }

  async create(user: UserInterface, { to, message }: CreateNotificationDto) {
    await this.db.insert(notifications)
      .values({
        from: user.sub,
        to,
        message
      })
      .returning();
    return { message: "Notification created successfully" };
  }

  async update(user: UserInterface, id: number) {
    const readAt = new Date().toISOString();
    await this.db.update(notifications).set({ readAt }).where(
      and(
        eq(notifications.id, id),
        eq(notifications.to, user.sub)
      )
    );
  }

  async delete(user: UserInterface, id: number) {
    await this.db.delete(notifications).where(
      and(
        eq(notifications.id, id),
        eq(notifications.to, user.sub)
      ));
    return {};
  }
}
