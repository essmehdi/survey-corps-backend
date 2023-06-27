import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  UseGuards,
  UseInterceptors
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AdminGuard } from "src/auth/guards/admin.guard";
import { AddQuestionDto } from "./dto/add-question.dto";
import { EditQuestionDto } from "./dto/edit-question.dto";
import { ReorderQuestionDto } from "./dto/reorder-question.dto";
import { QuestionsService } from "./questions.service";
import { EditInterceptor } from "../interceptors/edit.interceptor";
import { UnpublishedFormGuard } from "../guards/unpublished-form.guard";

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
  async getQuestion(
    @Param("section") section: number,
    @Param("question") question: number
  ) {
    return await this.questions.getQuestionById(section, question);
  }

  /**
   * Gets all questions of a section
   */
  @Get()
  async getAllQuestions(@Param("section") section: number) {
    return await this.questions.getQuestionsBySectionInOrder(section);
  }

  /**
   * Adds a question to a section
   */
  @Post()
  async addQuestion(
    @Param("section") section: number,
    @Body() addQuestionDto: AddQuestionDto
  ) {
    const newQuestion = await this.questions.addQuestion(
      addQuestionDto.title,
      addQuestionDto.type,
      section,
      addQuestionDto.required,
      addQuestionDto.previous,
      addQuestionDto.hasOther,
      addQuestionDto.regex
    );

    return newQuestion;
  }

  /**
   * Edit a question in a section
   */
  @Patch(":question")
  async editQuestion(
    @Param("section") section: number,
    @Param("question") question: number,
    @Body() editQuestionDto: EditQuestionDto
  ) {
    const { title, type, required, hasOther, regex } = editQuestionDto;
    return await this.questions.editQuestion(
      section,
      question,
      title,
      type,
      required,
      hasOther,
      regex
    );
  }

  /**
   * Changes the order of a question in a section
   */
  @Patch(":question")
  async reorderQuestion(
    @Param("section") section: number,
    @Param("question") question: number,
    @Body() reorderQuestionDto: ReorderQuestionDto
  ) {
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
    @Param("section") section: number,
    @Param("question") question: number
  ) {
    await this.questions.deleteQuestion(section, question);
    return {
      message: "Question deleted successfully"
    };
  }
}
