import { ApiHideProperty, ApiProperty } from "@nestjs/swagger";
import { QuestionType, Question } from "@prisma/client";
import { Exclude } from "class-transformer";

export class QuestionDto implements Question {
  id: number;
  title: string;
  description: string | null;
  required: boolean;

  @ApiProperty({
    enum: QuestionType
  })
  type: QuestionType;

  hasOther: boolean;

  regex: string | null;

  nextQuestionId: number | null;

  @Exclude()
  @ApiHideProperty()
  sectionId: number;
}
