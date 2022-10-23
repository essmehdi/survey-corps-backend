import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { AddQuestionDto } from '../dto/AddQuestionDto';
import { EditQuestionDto } from '../dto/EditQuestionDto';
import { QuestionsService } from './questions.service';

@Controller('sections/:section/questions')
export class QuestionsController {

  constructor (private questions: QuestionsService) {}

  @Get(':question')
  async getQuestion(@Param('section') section: number, @Param('question') question: number) {
    return await this.questions.getQuestionById(section, question);
  }

  @Get()
  async getAllQuestions(@Param('section') section: number) {
    return await this.questions.getQuestionsBySection(section);
  }

  @Post()
  async addQuestion(@Param('section') sectionId: number, @Body() addQuestionDto: AddQuestionDto) {
    const newQuestion = await this.questions.addQuestion(
      addQuestionDto.title,
      addQuestionDto.type,
      sectionId,
      addQuestionDto.required,
      addQuestionDto.hasOther
    );

    return newQuestion;
  }

  @Patch(':question')
  async editQuestion(@Param('section') section, @Param('question') question: number, @Body() editQuestionDto: EditQuestionDto) {
    const { title, type, required, hasOther } = editQuestionDto;
    await this.questions.editQuestion(section, question, title, type, required, hasOther);
    return {
      message: "Question modified successfully"
    };
  }

  @Patch(':question')
  async deleteQuestion(@Param('section') section, @Param('question') question: number) {
    await this.questions.deleteQuestion(section, question);
    return {
      message: "Question deleted successfully"
    };
  }
}
