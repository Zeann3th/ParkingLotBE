import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { TicketType } from "src/database/types";

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  type: TicketType;

  @IsString()
  @IsOptional()
  validTo: string;
}
