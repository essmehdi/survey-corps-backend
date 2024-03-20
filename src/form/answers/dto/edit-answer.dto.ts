import { IsOptional, IsString, Max, MaxLength } from "class-validator";
import { AddAnswerDto } from "./add-answer.dto";

export class EditAnswerDto extends AddAnswerDto {
  /**
   * New answer title
   */
  @IsString()
  @IsOptional()
  @MaxLength(100)
  title: string;
}
