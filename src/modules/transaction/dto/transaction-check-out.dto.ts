import { IsNotEmpty, IsString } from "class-validator";

export class TransactionCheckOutDto {
  @IsString()
  @IsNotEmpty()
  bankCode: string;

  @IsString()
  language: string;
}
