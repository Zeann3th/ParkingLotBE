import { IsOptional, IsString } from "class-validator";
import { TicketType } from "src/database/types";

export class UpdateTicketDto {
  @IsString()
  @IsOptional()
  type: TicketType;

  @IsString()
  @IsOptional()
  status: "AVAILABLE" | "INUSE" | "LOST";

  @IsString()
  @IsOptional()
  validTo: string;

  @IsString()
  @IsOptional()
  validFrom: string;
}
