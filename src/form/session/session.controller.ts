import { Controller, Get, Param } from "@nestjs/common";
import { AnswersService } from "../answers/answers.service";
import { QuestionsService } from "../questions/questions.service";
import { SectionsService } from "../sections/sections.service";

@Controller("session/:token")
@UseGuards(UnusedTokenGuard)
export class SessionController {
  constructor(
    private sections: SectionsService,
    private questions: QuestionsService,
    private answers: AnswersService
  ) {}

  @Get("sections/first")
  async getFirstSection() {
    return this.sections.firstSection();
  }

  @Get("sections/:section")
  async getSection(@Param("section") id: number) {
    const { nextSectionId, ...section } = await this.sections.section(id);
    const result = section;
    if (!nextSectionId) {
      const conditionalQuestion = await this.questions.getConditionalQuestion(
        id
      );
      if (conditionalQuestion) {
        result["nextSectionId"] = conditionalQuestion.id;
      }
    }
    return result;
  }

  @Get("sections/:section/questions")
  async getSectionQuestions(@Param("section") section: number) {
    return this.questions.getQuestionsBySectionInOrder(section);
  }
}
