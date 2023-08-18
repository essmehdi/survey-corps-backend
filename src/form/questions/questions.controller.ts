import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
  UseInterceptors
} from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { AdminGuard } from "src/auth/guards/admin.guard";
import { AddQuestionDto } from "./dto/add-question.dto";
import { EditQuestionDto } from "./dto/edit-question.dto";
import { ReorderQuestionDto } from "./dto/reorder-question.dto";
import { QuestionsService } from "./questions.service";
import { EditInterceptor } from "../interceptors/edit.interceptor";
import { UnpublishedFormGuard } from "../guards/unpublished-form.guard";
import { QuestionWithAnswersDto } from "./dto/question-with-answers.dto";
import { TransformDataInterceptor } from "src/common/interceptors/TransformDataInterceptor";
import { QuestionDto } from "./dto/question.dto";
import { MessageDto } from "src/common/dto/message.dto";

@ApiTags("Admin form", "Questions")
@Controller("admin/sections/:section/questions")
@UseGuards(AdminGuard)
@UseGuards(UnpublishedFormGuard)
@UseInterceptors(EditInterceptor)
export class QuestionsController {
  constructor(private questions: QuestionsService) {}

  /**
   * Gets a question by ID
   */
  @Get(":question")
  @UseInterceptors(new TransformDataInterceptor(QuestionWithAnswersDto))
  @ApiOkResponse({
    type: QuestionWithAnswersDto
  })
  async getQuestion(
    @Param("section", ParseIntPipe) section: number,
    @Param("question", ParseIntPipe) question: number
  ) {
    return await this.questions.getQuestionById(section, question);
  }

  /**
   * Gets all questions of a section
   */
  @Get()
  @UseInterceptors(new TransformDataInterceptor(QuestionWithAnswersDto))
  @ApiOkResponse({
    type: QuestionWithAnswersDto,
    isArray: true
  })
  async getAllQuestions(@Param("section", ParseIntPipe) section: number) {
    return await this.questions.getQuestionsBySectionInOrder(section);
  }

  /**
   * Adds a question to a section
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(new TransformDataInterceptor(QuestionDto))
  @ApiCreatedResponse({
    type: QuestionDto
  })
  async addQuestion(
    @Param("section", ParseIntPipe) section: number,
    @Body() addQuestionDto: AddQuestionDto
  ) {
    const newQuestion = await this.questions.addQuestion(
      addQuestionDto.title,
      addQuestionDto.type,
      section,
      addQuestionDto.required,
      addQuestionDto.previous,
      addQuestionDto.description,
      addQuestionDto.hasOther,
      addQuestionDto.regex
    );

    return newQuestion;
  }

  /**
   * Edit a question in a section
   */
  @Patch(":question")
  @UseInterceptors(new TransformDataInterceptor(QuestionDto))
  @ApiOkResponse({
    type: QuestionDto
  })
  async editQuestion(
    @Param("section", ParseIntPipe) section: number,
    @Param("question", ParseIntPipe) question: number,
    @Body() editQuestionDto: EditQuestionDto
  ) {
    const { title, description, type, required, hasOther, regex } =
      editQuestionDto;
    return await this.questions.editQuestion(
      section,
      question,
      title,
      description,
      type,
      required,
      hasOther,
      regex
    );
  }

  /**
   * Changes the order of a question in a section
   */
  @Patch(":question/reorder")
  async reorderQuestion(
    @Param("section", ParseIntPipe) section: number,
    @Param("question", ParseIntPipe) question: number,
    @Body() reorderQuestionDto: ReorderQuestionDto
  ): Promise<MessageDto> {
    const { previous } = reorderQuestionDto;
    await this.questions.reorderQuestion(section, question, previous);
    return {
      message: "Question reordered successfully"
    };
  }

  /**
   * Deletes a question in a section
   */
  @Delete(":question")
  async deleteQuestion(
    @Param("section", ParseIntPipe) section: number,
    @Param("question", ParseIntPipe) question: number
  ): Promise<MessageDto> {
    await this.questions.deleteQuestion(section, question);
    return {
      message: "Question deleted successfully"
    };
  }
}
