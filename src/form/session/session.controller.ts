import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { UnusedTokenGuard } from "src/tokens/guards/unusedToken.guard";
import { QuestionsService } from "../questions/questions.service";
import { SectionsService } from "../sections/sections.service";

@ApiTags("Form session")
@Controller("session/:token")
@UseGuards(UnusedTokenGuard)
export class SessionController {
  constructor(
    private sections: SectionsService,
    private questions: QuestionsService
  ) {}

  /**
   * Gets the first section of the form
   */
  @Get("sections/first")
  async getFirstSection() {
    return await this.sections.firstSection();
  }

  /**
   * Gets a section by ID
   */
  @Get("sections/:section")
  async getSection(@Param("section") id: number) {
    return await this.sections.section(id);
  }

  /**
   * Gets questions of a section
   */
  @Get("sections/:section/questions")
  async getSectionQuestions(@Param("section") section: number) {
    return await this.questions.getQuestionsBySectionInOrder(section);
  }
}
