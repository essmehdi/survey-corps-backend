import { IsNumber, IsOptional, IsPositive } from "class-validator";

export class ReorderQuestionDto {
  /**
   * ID of the new previous question
   */
  @IsNumber()
  @IsPositive()
  @IsOptional()
  previous: number | null;
}
