import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateNotificationDto {
  @IsInt()
  @IsOptional()
  @IsNotEmpty()
  to?: number;

  @IsString()
  @IsNotEmpty()
  message: string;
}
