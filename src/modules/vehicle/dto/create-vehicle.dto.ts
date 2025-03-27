import { IsIn, IsNotEmpty, IsString } from "class-validator";
import { VehicleType } from "src/database/types";

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  plate: string;

  @IsString()
  @IsIn(["CAR", "MOTORBIKE"])
  @IsNotEmpty()
  type: VehicleType;
}
