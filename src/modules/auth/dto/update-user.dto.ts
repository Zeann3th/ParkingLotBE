import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  password?: string;

  @IsOptional()
  role?: "ADMIN" | "USER";

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  sectionIds?: number[];
}
