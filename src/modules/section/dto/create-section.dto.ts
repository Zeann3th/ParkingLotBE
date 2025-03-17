import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateSectionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  capacity: number;
}
