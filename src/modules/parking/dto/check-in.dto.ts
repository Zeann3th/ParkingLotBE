import { IsNotEmpty, IsNumber, IsString } from "class-validator";
import { VehicleType } from "src/database/schema";

export class CheckInDto {
  @IsNumber()
  @IsNotEmpty()
  sectionId: number;

  @IsNumber()
  @IsNotEmpty()
  ticketId: number;

  @IsString()
  @IsNotEmpty()
  plate: string;

  @IsString()
  @IsNotEmpty()
  type: VehicleType;
}
