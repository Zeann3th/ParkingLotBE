import { HttpException, Inject, Injectable } from '@nestjs/common';
import { and, count, eq, like } from 'drizzle-orm';
import { UserInterface } from 'src/common/types';
import { DRIZZLE } from 'src/database/drizzle.module';
import { residences, residenceVehicles, userResidences, vehicles } from 'src/database/schema';
import { DrizzleDB } from 'src/database/types/drizzle';
import { CreateVehicleDto } from './dto/create-vehicle.dto';

@Injectable()
export class VehicleService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) { }

  async search(plate: string) {
    const data = await this.db.select({ vehicle: vehicles, residence: residences }).from(vehicles)
      .where(like(vehicles.plate, `%${plate}%`))
      .leftJoin(residenceVehicles, eq(residenceVehicles.vehicleId, vehicles.id))
      .leftJoin(residences, eq(residences.id, residenceVehicles.residenceId));

    return {
      count: data.length,
      data: data.map(({ vehicle, residence }) => ({ ...vehicle, residence }))
    };
  }

  async getAll(page: number, limit: number) {

    const [[{ countResult }], data] = await Promise.all([
      this.db.select({ countResult: count() }).from(vehicles),
      this.db.select({ vehicle: vehicles, residence: residences }).from(vehicles)
        .leftJoin(residenceVehicles, eq(residenceVehicles.vehicleId, vehicles.id))
        .leftJoin(residences, eq(residences.id, residenceVehicles.residenceId))
        .limit(limit).offset((page - 1) * limit)
    ]);

    return {
      count: Math.ceil(countResult / limit),
      data: data.map(({ vehicle, residence }) => ({ ...vehicle, residence }))
    };
  }

  async getById(id: number) {
    const [vehicle] = await this.db.select().from(vehicles)
      .where(eq(vehicles.id, id))
      .leftJoin(residenceVehicles, eq(residenceVehicles.vehicleId, vehicles.id))
      .leftJoin(residences, eq(residences.id, residenceVehicles.residenceId));

    if (!vehicle) {
      throw new HttpException("Vehicle not found", 404);
    }

    return { ...vehicle.vehicles, residence: vehicle.residences };
  }

  async create({ plate, type }: CreateVehicleDto) {
    try {
      await this.db.insert(vehicles).values({
        plate,
        type
      });

      return { message: "Vehicle created successfully" };
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
        .where(eq(vehicles.id, id));
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
