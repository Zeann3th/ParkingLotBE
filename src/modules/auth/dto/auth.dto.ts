import { IsNotEmpty, IsOptional, IsString } from "class-validator";

class BaseUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RegisterUserDto extends BaseUserDto {
  @IsString()
  @IsOptional()
  name: string;
}

export class LoginUserDto extends BaseUserDto {
}
