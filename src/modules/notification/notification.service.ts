import { HttpException, Inject, Injectable } from '@nestjs/common';
import { and, eq, ne } from 'drizzle-orm';
import { UserInterface } from 'src/common/types';
import { DRIZZLE } from 'src/database/drizzle.module';
import { notifications, users } from 'src/database/schema';
import { DrizzleDB } from 'src/database/types/drizzle';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) { }

  async getAll(user: UserInterface, page: number = 1, limit: number = 10) {
    if (user.role === "ADMIN") {
      return await this.db.select().from(notifications)
        .leftJoin(users, eq(users.role, "ADMIN"))
        .where(ne(notifications.status, "DELETED"))
        .limit(limit).offset((page - 1) * limit);
    } else {
      return await this.db.select().from(notifications)
        .where(and(
          eq(notifications.to, user.sub),
          ne(notifications.status, "DELETED")
        ))
        .limit(limit).offset((page - 1) * limit);
    }
  }

  async getById(user: UserInterface, id: number) {
    const [notification] = await this.db.select().from(notifications)
      .where(eq(notifications.id, id));

    if (user.role !== "ADMIN" && notification.to !== user.sub) {
      throw new HttpException("Not authorized to access this notification", 403);
    }

    return notification;
  }

  async create(user: UserInterface, { to, message }: CreateNotificationDto) {
    let recipientId: number | undefined = to;

    if (!recipientId) {
      const [admin] = await this.db.select().from(users)
        .where(eq(users.role, "ADMIN"));

      if (!admin) {
        throw new HttpException("Admin not found", 404);
      }

      recipientId = admin.id;
    } else {
      const [recipientUser] = await this.db.select().from(users)
        .where(eq(users.id, recipientId));

      if (!recipientUser) {
        throw new HttpException("Recipient not found", 404);
      }
    }

    await this.db.insert(notifications)
      .values({
        from: user.sub,
        to: recipientId,
        message
      })
      .returning();
    return { message: "Notification created successfully" };
  }

  async update(user: UserInterface, id: number, status: string) {
    if (status !== "READ" && status !== "DELETED") {
      throw new HttpException("Invalid notification's status", 400)
    }

    const [notification] = await this.db.select().from(notifications)
      .where(and(
        eq(notifications.id, id),
        eq(notifications.to, user.sub)
      ));
    if (!notification) {
      throw new HttpException("Notification not found", 404);
    }

    await this.db.update(notifications).set({ status }).where(
      and(
        eq(notifications.id, id),
        eq(notifications.to, user.sub)
      )
    );
    return { message: `Notification marked as ${status}` };
  }

  async delete(id: number) {
    const [notification] = await this.db.select().from(notifications)
      .where(eq(notifications.id, id));

    if (!notification) {
      throw new HttpException("Notification not found", 404);
    }

    await this.db.delete(notifications)
      .where(eq(notifications.id, id));
    return;
  }
}
