import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AddAnswerDto } from '../dto/AddAnswerDto';
import { QuestionsService } from '../questions/questions.service';
import { AnswersService } from './answers.service';

@Controller(':section/questions/:question/answers')
export class AnswersController {

  constructor (private answers: AnswersService, private questions: QuestionsService) {}

  @Post()
  async addAnswer(@Param('section') section: number, @Param('question') question: number, @Body() addAnswerDto: AddAnswerDto) {
    const q = await this.questions.getQuestionById(section, question);
    const answer = await this.answers.addAnswer(q.id, addAnswerDto.title);
    return {
      id: answer.id,
      title: answer.title
    };
  }

  @Get(':answer')
  async getAnswer(@Param('sections') section: number, @Param('question') question: number, @Param('answer') answer: number) {
    return await this.answers.getAnswers(section, question);
  }
}
