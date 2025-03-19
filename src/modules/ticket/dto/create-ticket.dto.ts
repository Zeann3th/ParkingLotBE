import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  ticketType: "MONTHLY" | "DAILY";

  @IsString()
  @IsOptional()
  validTo: string;
}
