import { HttpException, HttpStatus, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, QuestionType } from '@prisma/client';
import { NotFoundError } from '@prisma/client/runtime';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class QuestionsService {
  constructor(private prisma: PrismaService) { }

  private handleQueryException(error: any, entity: string = 'Question') {
    Logger.error(error);
    if (error instanceof NotFoundError) {
      throw new NotFoundError(`${entity} not found`);
    } else {
      throw new HttpException("An error has occured", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async addQuestion(title: string, type: QuestionType, sectionId: number, required?: boolean, hasOther?: boolean) {
    const data = {
      title,
      type,
      required: required ?? false,
    };
    if (type !== 'FREEFIELD') {
      data['hasOther'] = !!hasOther;
    }
    return await this.prisma.question.create({
      data: {
        ...data,
        section: { connect: { id: sectionId } }
      }
    });
  }

  async getQuestionsBySection(sectionId: number) {
    try {
      const section = await this.prisma.questionSection.findUniqueOrThrow({ where: { id: sectionId }, include: { questions: { include: { answers: true } } } });
      return section.questions;
    } catch (error) {
      this.handleQueryException(error, "Section");
    }
  }

  async getQuestionById(sectionId: number, questionId: number) {
    try {
      return await this.prisma.question.findFirstOrThrow({ where: { id: questionId, sectionId }, include: { answers: true } });
    } catch (error) {
      this.handleQueryException(error);
    }
  }

  async editQuestion(sectionId: number, questionId: number, title?: string, type?: QuestionType, required?: boolean, hasOther?: boolean) {
    const data = {};
    if (title) data['title'] = title;
    if (type) data['type'] = type;
    if (required !== undefined) data['required'] = required;
    if (hasOther !== undefined) data['hasOther'] = hasOther;
    await this.prisma.question.updateMany({ where: { id: questionId, sectionId }, data });
  }

  async deleteQuestion(sectionId: number, questionId: number) {
    await this.prisma.question.deleteMany({ where: { id: questionId, sectionId } });
  }
}
