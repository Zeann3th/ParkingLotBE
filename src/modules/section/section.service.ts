import { HttpException, Inject, Injectable } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { DRIZZLE } from 'src/database/drizzle.module';
import { DrizzleDB } from 'src/database/types/drizzle';
import { sections, slots } from 'src/database/schema';
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

  async create({ name, capacity }: CreateSectionDto) {
    await this.db.insert(sections).values({ name, capacity });
    return { message: "Section created successfully" };
  }

  async update(id: number, { name, capacity }: UpdateSectionDto) {
    let request = {
      ...name && { name },
      ...capacity && { capacity },
    }

    try {
      await this.db.update(sections).set(request).where(eq(sections.id, id));
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

  async getAllSlots(user: UserInterface, id: number) {
    if (user.role !== "ADMIN" && !user.privileges?.includes(id)) {
      throw new HttpException("You are not allowed to view this section", 403);
    }
    return await this.db.select().from(sections).where(eq(sections.id, id)).leftJoin(slots, eq(sections.id, slots.sectionId));
  }

  async getSlotById(user: UserInterface, sectionId: number, slotId: number) {
    if (user.role !== "ADMIN" && !user.privileges?.includes(sectionId)) {
      throw new HttpException("You are not allowed to view this section", 403);
    }
    const [slot] = await this.db.select().from(slots).where(and(
      eq(slots.id, slotId),
      eq(slots.sectionId, sectionId)
    ));
    return slot;
  }
}
