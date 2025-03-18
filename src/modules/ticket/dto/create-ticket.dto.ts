import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  ticketType: "MONTHLY" | "DAILY";

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsString()
  @IsOptional()
  validTo: string;
}
