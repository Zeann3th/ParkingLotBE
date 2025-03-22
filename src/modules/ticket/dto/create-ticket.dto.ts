import { IsIn, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, ValidateIf } from "class-validator";
import { TicketType, VehicleType } from "src/database/types";

export class CreateDailyTicketDto {
  @IsInt()
  @IsPositive()
  amount: number;
}

export class CreateTicketDto {
  @IsString()
  @IsIn(["DAILY", "MONTHLY", "RESERVED"])
  @IsNotEmpty()
  type: TicketType;

  @ValidateIf((o) => o.type !== "DAILY")
  @IsInt()
  @IsNotEmpty()
  userId: number;

  @ValidateIf((o) => o.type !== "DAILY")
  @IsInt()
  @IsPositive()
  @IsOptional()
  months?: number;

  @ValidateIf((o) => o.type === "RESERVED")
  @IsString()
  @IsNotEmpty()
  plate: string;

  @ValidateIf((o) => o.type === "RESERVED")
  @IsString()
  @IsIn(["CAR", "MOTORBIKE"])
  @IsNotEmpty()
  vehicleType: VehicleType;

  @ValidateIf((o) => o.type === "RESERVED")
  @IsInt()
  @IsNotEmpty()
  sectionId: number;

  @ValidateIf((o) => o.type === "RESERVED")
  @IsInt()
  @IsNotEmpty()
  slot: number;
}
