import { IsIn, IsInt, IsNotEmpty, IsString } from "class-validator";
import { VehicleType } from "src/database/types";

export class ReserveTicketDto {
  @IsString()
  @IsNotEmpty()
  plate: string;

  @IsString()
  @IsIn(["CAR", "MOTORBIKE"])
  @IsNotEmpty()
  vehicleType: VehicleType;

  @IsInt()
  @IsNotEmpty()
  sectionId: number;

  @IsInt()
  @IsNotEmpty()
  slot: number;
}
