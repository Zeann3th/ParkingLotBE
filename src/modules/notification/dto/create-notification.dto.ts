import { IsInt, IsNotEmpty, IsString } from "class-validator";

export class CreateNotificationDto {
  @IsInt()
  @IsNotEmpty()
  to: number;

  @IsString()
  @IsNotEmpty()
  message: string;
}
