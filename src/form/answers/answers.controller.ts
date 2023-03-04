import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards
} from "@nestjs/common";
import { AddAnswerDto } from "./dto/add-answer.dto";
import { AnswersService } from "./answers.service";
import { AdminGuard } from "src/auth/guards/admin.guard";
import { ApiTags } from "@nestjs/swagger";
import { EditAnswerDto } from "./dto/edit-answer.dto";

@ApiTags("Admin form", "Answers")
@Controller("admin/sections/:section/questions/:question/answers")
@UseGuards(AdminGuard)
export class AnswersController {
  constructor(private answers: AnswersService) {}

  /**
   * Gets question answers
   */
  @Get("")
  async getAnswers(
    @Param("section") section: number,
    @Param("question") question: number
  ) {
    return await this.answers.getAnswers(section, question);
  }

  /**
   * Gets an answer by ID
   */
  @Get(":answer")
  async getAnswer(
    @Param("section") section: number,
    @Param("question") question: number,
    @Param("answer") answer: number
  ) {
    return await this.answers.getAnswer(section, question, answer);
  }

  /**
   * Adds an answer to a question
   */
  @Post()
  async addAnswer(
    @Param("section") section: number,
    @Param("question") question: number,
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
    @Param("section") section: number,
    @Param("question") question: number,
    @Param("answer") answer: number,
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
    @Param("section") section: number,
    @Param("question") question: number,
    @Param("answer") answer: number
  ) {
    await this.answers.deleteAnswer(section, question, answer);
    return {
      message: "Answer successfully deleted"
    };
  }
}
