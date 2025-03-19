import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { UserRole } from "src/database/schema";

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  password?: string;

  @IsOptional()
  role?: UserRole;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  sectionIds?: number[];
}
