import { HttpException, Inject, Injectable } from '@nestjs/common';
import { and, count, eq } from 'drizzle-orm';
import { UserInterface } from 'src/common/types';
import { DRIZZLE } from 'src/database/drizzle.module';
import { notifications, usersView } from 'src/database/schema';
import { DrizzleDB } from 'src/database/types/drizzle';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { alias } from 'drizzle-orm/sqlite-core';

@Injectable()
export class NotificationService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) { }

  async getAll(user: UserInterface, page: number, limit: number) {
    if (user.role === "ADMIN") {
      const [[{ countResult }], data] = await Promise.all([
        this.db.select({ countResult: count() }).from(notifications)
          .where(eq(notifications.to, user.sub)),
        this.db.select({
          notification: notifications,
          userInfo: {
            id: usersView.id,
            username: usersView.username,
            name: usersView.name,
          }
        }).from(notifications)
          .where(eq(notifications.to, user.sub))
          .leftJoin(usersView, eq(usersView.id, notifications.from))
          .limit(limit).offset((page - 1) * limit)
      ]);

      return {
        count: Math.ceil(countResult / limit),
        data: data.map(({ notification, userInfo }) => {
          const { from, to, ...rest } = notification;
          return { ...rest, from: userInfo };
        })
      };

    } else {
      const [[{ countResult }], data] = await Promise.all([
        this.db.select({ countResult: count() }).from(notifications)
          .where(and(
            eq(notifications.to, user.sub),
          )),
        this.db.select({
          notification: notifications,
          userInfo: {
            id: usersView.id,
            username: usersView.username,
            name: usersView.name
          }
        }).from(notifications)
          .where(and(
            eq(notifications.to, user.sub),
          ))
          .leftJoin(usersView, eq(usersView.id, notifications.from))
          .limit(limit).offset((page - 1) * limit)
      ]);

      return {
        count: Math.ceil(countResult / limit),
        data: data.map(({ notification, userInfo }) => {
          const { from, to, ...rest } = notification;
          return { ...rest, from: userInfo };
        })
      };
    }
  }

  async getById(user: UserInterface, id: number) {
    const [{ notification, userInfo }] = await this.db.select({
      notification: notifications,
      userInfo: {
        id: usersView.id,
        username: usersView.username,
        name: usersView.name
      }
    }).from(notifications)
      .leftJoin(usersView, eq(usersView.id, notifications.from))
      .where(eq(notifications.id, id));

    if (user.role !== "ADMIN" && notification.to !== user.sub) {
      throw new HttpException("Not authorized to access this notification", 403);
    }

    const { from, to, ...rest } = notification;

    return { ...rest, from: userInfo };
  }

  async create(user: UserInterface, { to, message }: CreateNotificationDto) {
    let recipientId: number | undefined = to;

    if (!recipientId) {
      const [admin] = await this.db.select().from(usersView)
        .where(eq(usersView.role, "ADMIN"));

      if (!admin) {
        throw new HttpException("Admin not found", 404);
      }

      recipientId = admin.id;
    } else {
      const [recipientUser] = await this.db.select().from(usersView)
        .where(eq(usersView.id, recipientId));

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
    if (status !== "READ") {
      throw new HttpException("Invalid notification's status", 400);
    }

    const [notification] = await this.db.select().from(notifications)
      .where(and(
        eq(notifications.id, id),
        eq(notifications.to, user.sub)
      ));
    if (!notification) {
      throw new HttpException("Notification not found", 404);
    }

    await this.db.update(notifications).set({
      status,
      updatedAt: (new Date()).toISOString()
    }).where(
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
