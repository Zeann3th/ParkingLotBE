import { IsInt, IsNotEmpty } from "class-validator";
import { VehicleType } from "src/database/types";

export class ReserveTicketDto {
  @IsInt()
  @IsNotEmpty()
  sectionId: number;

  @IsInt()
  @IsNotEmpty()
  slot: number;
}
