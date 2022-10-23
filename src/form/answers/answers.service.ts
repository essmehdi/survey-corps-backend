import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { NotFoundError } from '@prisma/client/runtime';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AnswersService {
  constructor (private prisma: PrismaService) {}

  private handleQueryException(error: any, entity: string = 'Answer') {
    Logger.error(error);
    if (error instanceof NotFoundError) {
      throw new NotFoundError(`${entity} not found`);
    } else {
      throw new HttpException("An error has occured", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async addAnswer(questionId: number, title: string) {
    return await this.prisma.answer.create({
      data: {
        title,
        question: {
          connect: { id: questionId }
        }
      }
    });
  }

  async getAnswers(sectionId: number, questionId: number) {
    try {
      return (await this.prisma.question.findFirstOrThrow({ where: { id: questionId, sectionId }, include: { answers: true } })).answers;
    } catch (error) {
      this.handleQueryException(error, "Question");
    }
  }

  async getAnswer(sectionId: number, questionId: number, anwserId: number) {
    try {
      return (await this.prisma.answer.findFirstOrThrow({ where: { id: anwserId, question: { id: questionId, sectionId } } }));
    } catch (error) {
      this.handleQueryException(error);
    }
  }

  async editAnswer(sectionId: number, questionId: number, anwserId: number, title: string) {
    return await this.prisma.answer.updateMany({ where: { id: anwserId, question: { id: questionId, sectionId } }, data: { title } });
  }

  async deleteAnswer(sectionId: number, questionId: number, anwserId: number) {
    return await this.prisma.answer.deleteMany({ where: { id: anwserId, question: { id: questionId, sectionId } } });
  }
}
