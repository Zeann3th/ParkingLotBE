import { IsIn, IsInt, IsNotEmpty, IsString, ValidateIf } from "class-validator";
import { TicketType } from "src/database/types";

export class CreateTicketDto {
  @IsString()
  @IsIn(["DAILY", "MONTHLY", "RESERVED"])
  @IsNotEmpty()
  type: TicketType;

  @ValidateIf((o) => o.type !== "DAILY")
  @IsInt()
  @IsNotEmpty()
  userId: number;

  @ValidateIf((o) => o.type !== "DAILY")
  @IsInt()
  @IsNotEmpty()
  vehicleId: number;

  @ValidateIf((o) => o.type === "RESERVED")
  @IsInt()
  @IsNotEmpty()
  sectionId: number;

  @ValidateIf((o) => o.type === "RESERVED")
  @IsInt()
  @IsNotEmpty()
  slot: number;
}
