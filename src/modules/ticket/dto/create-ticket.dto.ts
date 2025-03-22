import { IsIn, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString } from "class-validator";
import { VehicleType } from "src/database/types";

export class CreateMonthlyTicketDto {
  @IsInt()
  @IsNotEmpty()
  userId: number;

  @IsInt()
  @IsPositive()
  @IsOptional()
  months?: number;
}

export class CreateReservedTicketDto extends CreateMonthlyTicketDto {
  @IsString()
  @IsNotEmpty()
  vehiclePlate: string;

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
