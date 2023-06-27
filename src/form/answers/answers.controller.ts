import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
  UseInterceptors
} from "@nestjs/common";
import { AddAnswerDto } from "./dto/add-answer.dto";
import { AnswersService } from "./answers.service";
import { AdminGuard } from "src/auth/guards/admin.guard";
import { ApiTags } from "@nestjs/swagger";
import { EditAnswerDto } from "./dto/edit-answer.dto";
import { UnpublishedFormGuard } from "../guards/unpublished-form.guard";
import { EditInterceptor } from "../interceptors/edit.interceptor";

@ApiTags("Admin form", "Answers")
@Controller("admin/sections/:section/questions/:question/answers")
@UseGuards(AdminGuard)
@UseGuards(UnpublishedFormGuard)
@UseInterceptors(EditInterceptor)
export class AnswersController {
  constructor(private answers: AnswersService) {}

  /**
   * Gets question answers
   */
  @Get("")
  async getAnswers(
    @Param("section", ParseIntPipe) section: number,
    @Param("question", ParseIntPipe) question: number
  ) {
    return await this.answers.getAnswers(section, question);
  }

  /**
   * Gets an answer by ID
   */
  @Get(":answer")
  async getAnswer(
    @Param("section", ParseIntPipe) section: number,
    @Param("question", ParseIntPipe) question: number,
    @Param("answer", ParseIntPipe) answer: number
  ) {
    return await this.answers.getAnswer(section, question, answer);
  }

  /**
   * Adds an answer to a question
   */
  @Post()
  async addAnswer(
    @Param("section", ParseIntPipe) section: number,
    @Param("question", ParseIntPipe) question: number,
    @Body() addAnswerDto: AddAnswerDto
  ) {
    const answer = await this.answers.addAnswer(
      section,
      question,
      addAnswerDto.title
    );
    return {
      id: answer.id,
      title: answer.title
    };
  }

  /**
   * Edits an answer
   */
  @Patch(":answer")
  async editAnswer(
    @Param("section", ParseIntPipe) section: number,
    @Param("question", ParseIntPipe) question: number,
    @Param("answer", ParseIntPipe) answer: number,
    @Body() editAnswerDto: EditAnswerDto
  ) {
    const { title } = editAnswerDto;
    return await this.answers.editAnswer(section, question, answer, title);
  }

  /**
   * Deletes an answer
   */
  @Delete(":answer")
  async deleteAnswer(
    @Param("section", ParseIntPipe) section: number,
    @Param("question", ParseIntPipe) question: number,
    @Param("answer", ParseIntPipe) answer: number
  ) {
    await this.answers.deleteAnswer(section, question, answer);
    return {
      message: "Answer successfully deleted"
    };
  }
}
