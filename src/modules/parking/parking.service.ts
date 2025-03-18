import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from 'src/database/drizzle.module';
import { DrizzleDB } from 'src/database/types/drizzle';

@Injectable()
export class ParkingService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) { }

  async checkIn() {
    // If vip, assign to vip slot 
    // If not vip, check if there are any available slots 
    // If there are, assign to the first available slot 
    // If there are no available slots, check if count < capacity
    // If count < capacity, create a new slot and assign to it 
    // If count >= capacity, GET OUT!!
  }

  async checkOut() {
  }

  async getAvailableSlots() {
  }
}
