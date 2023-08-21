import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { EditAnswerDto } from "./dto/edit-answer.dto";
import { UnpublishedFormGuard } from "../common/guards/unpublished-form.guard";
import { EditInterceptor } from "../common/interceptors/edit.interceptor";
import { MessageDto } from "src/common/dto/message.dto";
import { AnswerDto } from "./dto/answer.dto";
import { TransformDataInterceptor } from "src/common/interceptors/TransformDataInterceptor";

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
  @UseInterceptors(new TransformDataInterceptor(AnswerDto))
  @ApiOkResponse({
    type: AnswerDto,
    isArray: true
  })
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
  @UseInterceptors(new TransformDataInterceptor(AnswerDto))
  @ApiOkResponse({
    type: AnswerDto
  })
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
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(new TransformDataInterceptor(AnswerDto))
  @ApiCreatedResponse({
    type: AnswerDto
  })
  async addAnswer(
    @Param("section", ParseIntPipe) section: number,
    @Param("question", ParseIntPipe) question: number,
    @Body() addAnswerDto: AddAnswerDto
  ) {
    return await this.answers.addAnswer(section, question, addAnswerDto.title);
  }

  /**
   * Edits an answer
   */
  @Patch(":answer")
  @UseInterceptors(new TransformDataInterceptor(AnswerDto))
  @ApiOkResponse({
    type: AnswerDto
  })
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
  ): Promise<MessageDto> {
    await this.answers.deleteAnswer(section, question, answer);
    return {
      message: "Answer successfully deleted"
    };
  }
}
