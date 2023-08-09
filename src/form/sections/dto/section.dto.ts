import { ApiHideProperty } from "@nestjs/swagger";
import { QuestionSection } from "@prisma/client";
import { Exclude } from "class-transformer";

export class SectionDto implements QuestionSection {
  id: number;
  title: string;
  description: string;

  @Exclude()
  @ApiHideProperty()
  nextSectionId: number;
}
