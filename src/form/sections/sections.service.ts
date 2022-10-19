import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SectionsService {

  constructor (private prisma: PrismaService) {}

  async addSection(title: string) {
    return await this.prisma.questionSection.create({ data: { title } });
  }

  async section(sectionId: number) {
    return await this.prisma.questionSection.findUnique({
      where: { id: sectionId },
      include: {
        questions: {
          include: {
            answers: true
          }
        },
      }
    });
  }

  async editSection(sectionId: number, title: string) {
    await this.prisma.questionSection.update({ where: { id: sectionId }, data: { title } });
  }

  async deleteSection(sectionId: number) {
    await this.prisma.questionSection.delete({ where: { id: sectionId } });
  }
}
