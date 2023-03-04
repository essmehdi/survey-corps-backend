import { IsOptional, IsString } from "class-validator";
import { AddAnswerDto } from "./add-answer.dto";

export class EditAnswerDto extends AddAnswerDto {
  /**
   * New answer title
   */
  @IsOptional()
  title: string;
}
