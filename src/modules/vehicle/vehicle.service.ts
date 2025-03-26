import { HttpException, Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { UserInterface } from 'src/common/types';
import { DRIZZLE } from 'src/database/drizzle.module';
import { residences, residenceVehicles, userResidences, users, vehicles } from 'src/database/schema';
import { DrizzleDB } from 'src/database/types/drizzle';
import { CreateVehicleDto } from './dto/create-vehicle.dto';

@Injectable()
export class VehicleService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) { }

  async getAll(user: UserInterface) {
    const vehicleList = await this.db.select({ vehicle: vehicles, residence: residences }).from(vehicles)
      .leftJoin(residenceVehicles, eq(residenceVehicles.vehicleId, vehicles.id))
      .leftJoin(residences, eq(residences.id, residenceVehicles.residenceId));

    return vehicleList.map(({ vehicle, residence }) => ({ ...vehicle, residence }));
  }

  async getById(user: UserInterface, id: number) {
    const [vehicle] = await this.db.select().from(vehicles)
      .where(eq(vehicles.id, id))
      .leftJoin(residenceVehicles, eq(residenceVehicles.vehicleId, vehicles.id))
      .leftJoin(residences, eq(residences.id, residenceVehicles.residenceId));

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
