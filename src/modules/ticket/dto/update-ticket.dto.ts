import { IsDecimal, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { TicketType, VehicleType } from "src/database/types";

export class UpdateTicketDto {
  @IsString()
  @IsOptional()
  type: TicketType;

  @IsString()
  @IsOptional()
  validTo: string;

  @IsString()
  @IsOptional()
  validFrom: string;

  @IsString()
  @IsOptional()
  status: "AVAILABLE" | "INUSE" | "LOST";
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
