import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { TicketType } from "src/database/schema";

export class UpdateTicketDto {
  @IsString()
  @IsNotEmpty()
  type: TicketType;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsString()
  @IsOptional()
  validTo: string;

  @IsString()
  @IsOptional()
  validFrom: string;
}
