import { IsNotEmpty, IsString, Max, MaxLength } from "class-validator";

export class AddAnswerDto {
  /**
   * Answer title
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;
}
