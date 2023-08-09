import { ApiHideProperty } from "@nestjs/swagger";
import { Answer } from "@prisma/client";
import { Exclude } from "class-transformer";

export class AnswerDto implements Answer {
  id: number;
  title: string;

  @Exclude()
  @ApiHideProperty()
  questionId: number;
}
