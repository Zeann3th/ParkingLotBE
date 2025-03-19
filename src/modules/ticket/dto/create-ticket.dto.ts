import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { TicketType } from "src/database/schema";

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  type: TicketType;

  @IsString()
  @IsOptional()
  validTo: string;
}
