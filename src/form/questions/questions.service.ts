import { Injectable } from '@nestjs/common';
import { Prisma, QuestionType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class QuestionsService {
  constructor (private prisma: PrismaService) {}
  
  async addQuestion(title: string, type: QuestionType, sectionId: number, required?: boolean, hasOther?: boolean) {
    const data = {
      title,
      type,
      required: required ?? false,
    };
    if (type !== 'FREEFIELD') {
      data['hasOther'] = !!hasOther;
    }
    return this.prisma.question.create({
      data: {
        ...data,
        section: { connect: { id: sectionId } }
      }
    });
  }

  async question(criteria: Prisma.QuestionWhereInput) {
    return await this.prisma.question.findFirst({ where: criteria, include: { answers: true } });
  }

  async questions(criteria?: Prisma.QuestionWhereInput) {
    return await this.prisma.question.findMany({ where: criteria, include: { answers: true } });
  }

  async editQuestion(criteria: Prisma.QuestionWhereUniqueInput, title?: string, type?: QuestionType, required?: boolean, hasOther?: boolean) {
    const data = {};
    if (title) data['title'] = title;
    if (type) data['type'] = type;
    if (required !== undefined) data['required'] = required;
    if (hasOther !== undefined) data['hasOther'] = hasOther;
    await this.prisma.question.update({ where: criteria, data });
  }

  async deleteQuestion(criteria: Prisma.QuestionWhereUniqueInput) {
    await this.prisma.question.delete({ where: criteria });
  }
}
