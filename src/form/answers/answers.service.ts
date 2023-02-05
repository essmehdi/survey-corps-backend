import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { NotFoundError } from "@prisma/client/runtime";
import { PrismaError } from "prisma-error-enum";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class AnswersService {
  private readonly logger = new Logger(AnswersService.name);

  constructor(private prisma: PrismaService) {}

  private handleQueryException(error: any, entity: string = "Answer") {
    this.logger.error(error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === PrismaError.RecordDoesNotExist)
        throw new NotFoundException(`The requested ${entity} does not exist`);
      else if (error.code === PrismaError.RecordsNotFound)
        throw new NotFoundException(`The requested ${entity} was not found`);
    }
    throw new InternalServerErrorException("An error has occured");
  }

  async addAnswer(sectionId: number, questionId: number, title: string) {
    try {
      var question = await this.prisma.question.findFirstOrThrow({
        where: { id: questionId, sectionId },
        include: { conditions: true }
      });

      const newAnswer = await this.prisma.answer.create({
        data: {
          title,
          question: {
            connect: { id: question.id }
          }
        }
      });

      return newAnswer;
    } catch (error) {
      this.handleQueryException(error);
    }
  }

  async getAnswers(sectionId: number, questionId: number) {
    try {
      return (
        await this.prisma.question.findFirstOrThrow({
          where: { id: questionId, sectionId },
          include: { answers: true }
        })
      ).answers;
    } catch (error) {
      this.handleQueryException(error, "Question");
    }
  }

  async getAnswer(sectionId: number, questionId: number, anwserId: number) {
    try {
      return await this.prisma.answer.findFirstOrThrow({
        where: { id: anwserId, question: { id: questionId, sectionId } }
      });
    } catch (error) {
      this.handleQueryException(error);
    }
  }

  async editAnswer(
    sectionId: number,
    questionId: number,
    anwserId: number,
    title: string
  ) {
    try {
      return await this.prisma.answer.updateMany({
        where: { id: anwserId, question: { id: questionId, sectionId } },
        data: { title }
      });
    } catch (error) {
      this.handleQueryException(error);
    }
  }

  async deleteAnswer(sectionId: number, questionId: number, anwserId: number) {
    try {
      return await this.prisma.answer.deleteMany({
        where: { id: anwserId, question: { id: questionId, sectionId } }
      });
    } catch (error) {
      this.handleQueryException(error);
    }
  }
}
