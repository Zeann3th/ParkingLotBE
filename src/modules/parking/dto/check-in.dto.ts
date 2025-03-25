import { IsIn, IsNotEmpty, IsNumber, IsString } from "class-validator";
import { VehicleType } from "src/database/types";

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
  @IsIn(["CAR", "MOTOBIKE"])
  @IsNotEmpty()
  type: VehicleType;
}
