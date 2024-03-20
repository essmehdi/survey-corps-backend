import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaError } from "prisma-error-enum";
import { ResourceNotFoundException } from "src/common/exceptions/resource-not-found.exception";
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

  /**
   * Register an answer to a question
   * @param sectionId The section id
   * @param questionId The question id
   * @param title Answer title
   * @returns The new answer
   *
   * @throws {ResourceNotFoundException} If the question does not exist
   */
  async addAnswer(sectionId: number, questionId: number, title: string) {
    var question = await this.prisma.question.findFirst({
      where: { id: questionId, sectionId },
      include: { conditions: true }
    });

    // Check if the question exists
    if (!question) {
      throw new ResourceNotFoundException(
        `Question ${questionId} in section ${sectionId}`
      );
    }

    const newAnswer = await this.prisma.answer.create({
      data: {
        title,
        question: {
          connect: { id: question.id }
        }
      }
    });

    return newAnswer;
  }

  /**
   * Gets all registered answers for a question
   * @param sectionId The section id
   * @param questionId The question id
   * @returns The answers of the question
   *
   * @throws {ResourceNotFoundException} If the question does not exist
   */
  async getAnswers(sectionId: number, questionId: number) {
    const question = await this.prisma.question.findFirst({
      where: { id: questionId, sectionId },
      include: { answers: true }
    });

    // Check if the question exists
    if (!question) {
      throw new ResourceNotFoundException(
        `Question ${questionId} in section ${sectionId}`
      );
    }

    return question.answers;
  }

  /**
   * Gets a specific answer by id
   * @param sectionId The section id
   * @param questionId The question id
   * @param anwserId The answer id
   * @returns The answer
   *
   * @throws {ResourceNotFoundException} If the answer does not exist
   */
  async getAnswer(sectionId: number, questionId: number, anwserId: number) {
    const answer = await this.prisma.answer.findFirst({
      where: { id: anwserId, question: { id: questionId, sectionId } }
    });

    // Check if answer exists
    if (!answer) {
      throw new ResourceNotFoundException(
        `Answer ${anwserId} in question ${questionId} in section ${sectionId}`
      );
    }

    return answer;
  }

  /**
   * Edits an answer
   * @param sectionId The section id
   * @param questionId The question id
   * @param answerId The answer id
   * @param title The new answer title
   * @returns The updated answer
   */
  async editAnswer(
    sectionId: number,
    questionId: number,
    answerId: number,
    title: string
  ) {
    return await this.prisma.$transaction(async (tx) => {
      await tx.answer.updateMany({
        where: { id: answerId, question: { id: questionId, sectionId } },
        data: { title }
      });

      return await tx.answer.findFirst({
        where: { id: answerId, question: { id: questionId, sectionId } }
      });
    });
  }

  /**
   * Deletes an answer
   * @param sectionId The section id
   * @param questionId The question id
   * @param anwserId The answer id
   */
  async deleteAnswer(sectionId: number, questionId: number, anwserId: number) {
    return await this.prisma.answer.deleteMany({
      where: { id: anwserId, question: { id: questionId, sectionId } }
    });
  }
}
