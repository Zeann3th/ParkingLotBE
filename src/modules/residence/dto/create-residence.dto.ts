import { IsInt, IsNotEmpty, IsString } from "class-validator";

export class CreateResidenceDto {
  @IsString()
  @IsNotEmpty()
  building: string;

  @IsInt()
  @IsNotEmpty()
  room: number
}
