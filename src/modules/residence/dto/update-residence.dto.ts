import { IsInt, IsOptional, IsString } from "class-validator";

export class UpdateResidenceDto {
  @IsString()
  @IsOptional()
  building?: string;

  @IsInt()
  @IsOptional()
  room?: number
}
