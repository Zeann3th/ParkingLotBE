import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from 'src/database/drizzle.module';
import { DrizzleDB } from 'src/database/types/drizzle';

@Injectable()
export class FloorService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) { }
}
