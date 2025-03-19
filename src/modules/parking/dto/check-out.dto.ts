import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CheckOutDto {
  @IsNumber()
  @IsNotEmpty()
  sectionId: number;

  @IsNumber()
  @IsNotEmpty()
  ticketId: number;

  @IsString()
  @IsNotEmpty()
  plate: string;
}
