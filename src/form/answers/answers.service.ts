import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AnswersService {
  constructor (private prisma: PrismaService) {}

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

  async getAnswers(criteria: Prisma.AnswerWhereInput) {
    return await this.prisma.answer.findMany({ where: criteria });
  }

  async getAnswer(criteria: Prisma.AnswerWhereUniqueInput) {
    return await this.prisma.answer.findUnique({ where: criteria });
  }

  async editAnswer(criteria: Prisma.AnswerWhereUniqueInput, title: string) {
    return await this.prisma.answer.update({ where: criteria, data: { title } });
  }

  async deleteAnswer(criteria: Prisma.AnswerWhereUniqueInput) {
    return await this.prisma.answer.delete({ where: criteria });
  }
}
