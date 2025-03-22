import { IsDecimal, IsIn, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, ValidateIf } from "class-validator";
import { TicketStatus, TicketType, VehicleType } from "src/database/types";

export class UpdateTicketDto {
  @IsString()
  @IsIn(["DAILY", "MONTHLY", "RESERVED"])
  @IsOptional()
  type: TicketType;

  @IsString()
  @IsIn(["AVAILABLE", "INUSE", "LOST"])
  @IsOptional()
  status: TicketStatus;

  @ValidateIf((o) => o.type !== "DAILY")
  @IsInt()
  @IsPositive()
  @IsOptional()
  months?: number
}

export class UpdateTicketPricingDto {
  @IsString()
  @IsNotEmpty()
  type: TicketType;

  @IsDecimal()
  @IsNotEmpty()
  price: string;

  @IsString()
  @IsNotEmpty()
  vehicleType: VehicleType;
}
