import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { AddAnswerDto } from "./dto/add-answer.dto";
import { AnswersService } from "./answers.service";
import { AdminGuard } from "src/auth/guards/admin.guard";
import { ApiTags } from "@nestjs/swagger";

@ApiTags("Admin form", "Answers")
@Controller("admin/sections/:section/questions/:question/answers")
@UseGuards(AdminGuard)
export class AnswersController {
  constructor(private answers: AnswersService) {}

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
}
