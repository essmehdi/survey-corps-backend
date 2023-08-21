import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
  UseInterceptors
} from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { UnusedTokenGuard } from "src/tokens/guards/unusedToken.guard";
import { QuestionsService } from "../questions/questions.service";
import { SectionsService } from "../sections/sections.service";
import { SessionSectionDto } from "./dto/session-section.dto";
import { TransformDataInterceptor } from "src/common/interceptors/TransformDataInterceptor";
import { QuestionWithAnswersDto } from "../questions/dto/question-with-answers.dto";

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
  @UseInterceptors(new TransformDataInterceptor(SessionSectionDto))
  @ApiOkResponse({
    type: SessionSectionDto
  })
  async getFirstSection() {
    return await this.sections.firstSection();
  }

  /**
   * Gets a section by ID
   */
  @Get("sections/:section")
  @UseInterceptors(new TransformDataInterceptor(SessionSectionDto))
  @ApiOkResponse({
    type: SessionSectionDto
  })
  async getSection(@Param("section", ParseIntPipe) id: number) {
    return await this.sections.getSection(id);
  }

  /**
   * Gets questions of a section
   */
  @Get("sections/:section/questions")
  @UseInterceptors(new TransformDataInterceptor(QuestionWithAnswersDto))
  @ApiOkResponse({
    type: QuestionWithAnswersDto
  })
  async getSectionQuestions(@Param("section", ParseIntPipe) section: number) {
    return await this.questions.getQuestionsBySectionInOrder(section);
  }
}
