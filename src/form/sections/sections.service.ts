import { HttpException, HttpStatus, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { NotFoundError } from 'rxjs';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SectionsService {

  constructor (private prisma: PrismaService) {}

  private handleQueryException(error: any, entity: string = 'Section') {
    Logger.error(error);
    if (error instanceof NotFoundError) {
      throw new NotFoundException();
    } else {
      throw new HttpException("An error has occured", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async addSection(title: string) {
    return await this.prisma.questionSection.create({ data: { title } });
  }

  async section(sectionId: number) {
    try {
      return await this.prisma.questionSection.findUniqueOrThrow({
        where: { id: sectionId },
        include: {
          questions: {
            include: {
              answers: true
            }
          },
        }
      });
    } catch (error) {
      this.handleQueryException(error);
    }
  }

  async editSection(sectionId: number, title: string) {
    await this.prisma.questionSection.update({ where: { id: sectionId }, data: { title } });
  }

  async deleteSection(sectionId: number) {
    await this.prisma.questionSection.delete({ where: { id: sectionId } });
  }
}
