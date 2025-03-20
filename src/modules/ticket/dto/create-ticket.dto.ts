import { IsNotEmpty, IsOptional, IsString, ValidateIf } from "class-validator";
import { TicketType } from "src/database/types";

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  type: TicketType;

  @ValidateIf((o) => o.type !== "DAILY")
  @IsString()
  @IsNotEmpty()
  validTo: string;
}
