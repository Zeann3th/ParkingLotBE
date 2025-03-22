import { HttpException, Inject, Injectable } from '@nestjs/common';
import { and, eq, gte, inArray, isNotNull, lte, sum } from 'drizzle-orm';
import { DRIZZLE } from 'src/database/drizzle.module';
import { DrizzleDB } from 'src/database/types/drizzle';
import { history, notifications, sections, userPrivileges, vehicleReservations } from 'src/database/schema';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { Request } from 'express';
import { UserInterface } from 'src/common/types';

@Injectable()
export class SectionService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) { }

  async getAll(user: UserInterface) {
    if (user.role === "ADMIN") {
      return await this.db.select().from(sections);
    }

    if (!user.privileges) {
      throw new HttpException("You are not allowed to view any sections", 403);
    }

    return await this.db.select().from(sections).where(inArray(sections.id, user.privileges));
  }

  async getById(user: UserInterface, id: number) {
    if (user.role !== "ADMIN" && !user.privileges?.includes(id)) {
      throw new HttpException("You are not allowed to view this section", 403);
    }

    const [section] = await this.db.select().from(sections).where(eq(sections.id, id));
    return section;
  }

  async getReservedSlots(user: UserInterface, id: number) {
    if (user.role !== "ADMIN" && !user.privileges?.includes(id)) {
      throw new HttpException("You are not allowed to view this section", 403);
    }

    const res = await this.db.select({ slot: vehicleReservations.slot }).from(vehicleReservations).where(and(
      eq(vehicleReservations.sectionId, id),
    ));
    return res.map(({ slot }) => slot);
  }

  async create({ name, capacity }: CreateSectionDto) {
    try {
      await this.db.insert(sections).values({ name, capacity });
    } catch (e: any) {
      if (e.code === 'SQLITE_CONSTRAINT') {
        throw new HttpException("Section name already exists", 409);
      }
      throw new HttpException("Failed to create section", 500);
    }
    return { message: "Section created successfully" };
  }

  async update(user: UserInterface, id: number, { name, capacity, privilegedTo }: UpdateSectionDto) {
    let request = {
      ...name && { name },
      ...capacity && { capacity },
    }

    try {
      const [section] = await this.db.update(sections).set(request).where(eq(sections.id, id)).returning();
      if (privilegedTo && privilegedTo.length > 0) {
        await this.db.transaction(async (tx) => {
          await tx.delete(userPrivileges).where(eq(userPrivileges.sectionId, id));

          const privilegeValues = privilegedTo.map(userId => ({ userId, sectionId: id }));
          await tx.insert(userPrivileges).values(privilegeValues);

          const notificationValues = privilegedTo.map(userId => ({
            from: user.sub,
            to: userId,
            message: `You have been granted access to section ${section.name}`
          }));
          await tx.insert(notifications).values(notificationValues);
        });
      }
      return section;
    }
    catch (e: any) {
      if (e.code === 'SQLITE_CONSTRAINT') {
        throw new HttpException("Section name already exists", 409);
      }
      throw new HttpException("Failed to update section", 500);
    }
  }

  async delete(id: number) {
    await this.db.delete(sections).where(eq(sections.id, id));
    return {}
  }

  async report(user: UserInterface, id: number, from: string, to: string) {
    if (user.role !== "ADMIN" && !user.privileges?.includes(id)) {
      throw new HttpException("You are not allowed to view this section", 403);
    }

    if (!from) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      from = sevenDaysAgo.toISOString();
    }

    if (!to) {
      to = new Date().toISOString();
    }

    let [{ sum: revenue }] = await this.db.select({ sum: sum(history.fee) }).from(history).where(and(
      eq(history.sectionId, id),
      gte(history.checkedInAt, from),
      lte(history.checkedInAt, to),
    ))

    return { revenue: Number(revenue) || 0 };
  }
}
