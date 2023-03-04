import { IsNumber, IsString } from "class-validator";

export class AddAnswerDto {
  /**
   * Answer title
   */
  @IsString()
  title: string;
}
