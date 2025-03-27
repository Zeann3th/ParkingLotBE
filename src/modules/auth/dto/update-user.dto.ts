import { IsArray, IsEmail, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { UserRole } from "src/database/types";

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsIn(["ADMIN", "SECURITY", "USER"])
  role?: UserRole;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;
}
