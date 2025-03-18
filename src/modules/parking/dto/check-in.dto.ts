import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CheckInDto {
  @IsNumber()
  @IsNotEmpty()
  sectionId: number;

  @IsNumber()
  @IsNotEmpty()
  ticketId: number;

  @IsString()
  @IsNotEmpty()
  plate: string;

  @IsString()
  @IsNotEmpty()
  type: "CAR" | "MOTORBIKE";
}
