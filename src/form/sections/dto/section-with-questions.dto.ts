import { ApiProperty } from "@nestjs/swagger";
import { SectionDto } from "./section.dto";
import { ConditionDto } from "./change-next-section.dto";
import { QuestionWithAnswersDto } from "src/form/questions/dto/question-with-answers.dto";

export class SectionWithQuestionsDto extends SectionDto {
  questions: QuestionWithAnswersDto;

  @ApiProperty({
    oneOf: [{ type: "number" }, { type: "null" }, { type: "ConditionDto" }]
  })
  next: number | ConditionDto | null;
}
