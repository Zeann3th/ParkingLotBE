import { HttpException, Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { UserInterface } from 'src/common/types';
import { DRIZZLE } from 'src/database/drizzle.module';
import { residenceVehicles, userResidences, vehicles } from 'src/database/schema';
import { DrizzleDB } from 'src/database/types/drizzle';
import { CreateVehicleDto } from './dto/create-vehicle.dto';

@Injectable()
export class VehicleService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) { }

  async getAll() {
    return await this.db.select().from(vehicles);
  }

  async getById(id: number) {
    const [vehicle] = await this.db.select().from(vehicles)
      .where(eq(vehicles.id, id));
    return vehicle;
  }

  async create({ plate, type }: CreateVehicleDto) {
    try {
      await this.db.insert(vehicles).values({
        plate,
        type
      });
    } catch (error: any) {
      if (error.code === "SQLITE_CONSTRAINT") {
        throw new HttpException("Vehicle's plate already exists", 409);
      }
      throw new HttpException("Internal server error", 500);
    }
  }

  async update(id: number, plate: string) {
    const [vehicle] = await this.db.select().from(vehicles)
      .where(eq(vehicles.id, id));

    if (!vehicle) {
      throw new HttpException("Vehicle not found", 404);
    }

    try {
      await this.db.update(vehicles).set({ plate })
        .where(eq(vehicles.id, id))
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT') {
        throw new HttpException("Vehicle having this plate already exists", 409);
      }
      throw new HttpException("Internal server error", 500);
    }
  }

  async delete(id: number) {
    const [vehicle] = await this.db.select().from(vehicles)
      .where(eq(vehicles.id, id));

    if (!vehicle) {
      throw new HttpException("Vehicle not found", 404);
    }

    await this.db.delete(vehicles).where(eq(vehicles.id, id)).returning();
    return;
  }
}
