import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { AddQuestionDto } from '../dto/AddQuestionDto';
import { EditQuestionDto } from '../dto/EditQuestionDto';
import { QuestionsService } from './questions.service';

@Controller('sections/:section/questions')
export class QuestionsController {

  constructor (private questions: QuestionsService) {}

  @Get(':question')
  async getQuestion(@Param('section') section: number, @Param('question') question: number) {
    return await this.questions.question({
      sectionId: section,
      id: question
    });
  }

  @Get()
  async getAllQuestions(@Param('section') section: number) {
    return await this.questions.questions({ sectionId: section });
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
  async editQuestion(@Param('question') question: number, @Body() editQuestionDto: EditQuestionDto) {
    const { title, type, required, hasOther } = editQuestionDto;
    const q = await this.questions.editQuestion({ id: question }, title, type, required, hasOther);
    return {
      message: "Question modified successfully"
    };
  }

  @Patch(':question')
  async deleteQuestion(@Param('question') question: number) {
    await this.questions.deleteQuestion({ id: question });
    return {
      message: "Question deleted successfully"
    };
  }
}
