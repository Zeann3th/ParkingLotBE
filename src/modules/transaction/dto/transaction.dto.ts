import { IsIn, IsNumber, IsOptional, IsString } from "class-validator";
import { TransactionStatus } from "src/database/types";

export class CreateTransactionDto {
  @IsNumber()
  amount: number;

  @IsNumber()
  userId: number;

  @IsNumber()
  month: number;

  @IsNumber()
  year: number;
}

export class UpdateTransactionDto {
  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsString()
  @IsIn(["PENDING", "PAID"])
  @IsOptional()
  status?: TransactionStatus;
}
