import { HttpException, Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DRIZZLE } from 'src/database/drizzle.module';
import { residences, residenceVehicles, userResidences, users, vehicles } from 'src/database/schema';
import { DrizzleDB } from 'src/database/types/drizzle';
import { CreateResidenceDto } from './dto/create-residence.dto';
import { UpdateResidenceDto } from './dto/update-residence.dto';

@Injectable()
export class ResidenceService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) { }

  async getAll() {
    return await this.db.select().from(residences)
  }

  async getById(id: number) {
    return await this.db.select().from(residences)
      .where(eq(residences.id, id))
  }

  async create({ building, room }: CreateResidenceDto) {
    try {
      await this.db.insert(residences).values({
        building,
        room
      });
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT') {
        throw new HttpException("Residence already exists", 409);
      }
      throw new HttpException("Failed to create residence", 500);
    }
    return { message: `Residence room ${room}, building ${building} successfully created` };
  }

  async update(id: number, { building, room }: UpdateResidenceDto) {
    if (!building && !room) {
      throw new HttpException("No fields to update", 400);
    }

    const [residence] = await this.db.select().from(residences)
      .where(eq(residences.id, id))
    if (!residence) {
      throw new HttpException("Residence not found", 404);
    }

    await this.db.update(residences).set({
      ...(building ? { building } : {}),
      ...(room ? { room } : {})
    })
      .where(eq(residences.id, id))
  }

  async addResident(id: number, userId: number) {
    const [[residence], [user]] = await Promise.all([
      this.db.select().from(residences).where(eq(residences.id, id)),
      this.db.select().from(users).where(eq(users.id, userId))
    ])

    if (!residence) {
      throw new HttpException("Residence not found", 404);
    }

    if (!user) {
      throw new HttpException("User not found", 404);
    }

    await this.db.insert(userResidences).values({
      residenceId: id,
      userId
    });

    return { message: `User ${userId} added to residence ${id}` }
  }

  async removeResident(id: number, userId: number) {
    const [[residence], [user]] = await Promise.all([
      this.db.select().from(residences).where(eq(residences.id, id)),
      this.db.select().from(users).where(eq(users.id, userId))
    ])

    if (!residence) {
      throw new HttpException("Residence not found", 404);
    }

    if (!user) {
      throw new HttpException("User not found", 404);
    }

    const [existUserInResidence] = await this.db.select().from(userResidences)
      .where(and(
        eq(userResidences.userId, userId),
        eq(userResidences.residenceId, id)
      ))
    if (!existUserInResidence) {
      throw new HttpException("User not found in residence", 404);
    }

    await this.db.delete(userResidences).where(and(
      eq(userResidences.userId, userId),
      eq(userResidences.residenceId, id)
    ))

    return { message: `User ${userId} removed from residence ${id}` }
  }

  async addVehicle(id: number, vehicleId: number) {
    const [[residence], [vehicle]] = await Promise.all([
      this.db.select().from(residences).where(eq(residences.id, id)),
      this.db.select().from(vehicles).where(eq(vehicles.id, vehicleId))
    ])

    if (!residence) {
      throw new HttpException("Residence not found", 404);
    }

    if (!vehicle) {
      throw new HttpException("Vehicle not found", 404);
    }

    await this.db.insert(residenceVehicles).values({
      residenceId: id,
      vehicleId
    });

    return { message: `Vehicle ${vehicleId} added to residence ${id}` }
  }

  async removeVehicle(id: number, vehicleId: number) {
    const [[residence], [vehicle]] = await Promise.all([
      this.db.select().from(residences).where(eq(residences.id, id)),
      this.db.select().from(vehicles).where(eq(vehicles.id, vehicleId))
    ])

    if (!residence) {
      throw new HttpException("Residence not found", 404);
    }

    if (!vehicle) {
      throw new HttpException("Vehicle not found", 404);
    }

    const [existVehicleInResidence] = await this.db.select().from(residenceVehicles)
      .where(and(
        eq(residenceVehicles.residenceId, id),
        eq(residenceVehicles.vehicleId, vehicleId)
      ))
    if (!existVehicleInResidence) {
      throw new HttpException("Vehicle not found in residence", 404);
    }

    await this.db.delete(residenceVehicles).where(and(
      eq(residenceVehicles.residenceId, id),
      eq(residenceVehicles.vehicleId, vehicleId)
    ))

    return { message: `Vehicle ${vehicleId} removed from residence ${id}` }
  }


  async delete(id: number) {
    const [residence] = await this.db.select().from(residences)
      .where(eq(residences.id, id))

    if (!residence) {
      throw new HttpException("Residence not found", 404);
    }

    await this.db.delete(residences).where(eq(residences.id, id))
    return;
  }
}
