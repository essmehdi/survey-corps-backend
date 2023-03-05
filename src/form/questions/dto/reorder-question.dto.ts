import { IsNumber, IsPositive } from "class-validator";

export class ReorderQuestionDto {
  /**
   * ID of the new previous question
   */
  @IsNumber()
  @IsPositive()
  previous: number;
}
