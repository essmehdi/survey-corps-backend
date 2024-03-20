import { AnswerDto } from "src/form/answers/dto/answer.dto";
import { QuestionDto } from "./question.dto";
import { Type } from "class-transformer";

export class QuestionWithAnswersDto extends QuestionDto {
  @Type(() => AnswerDto)
  answers: AnswerDto[];
}
