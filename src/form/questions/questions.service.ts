import { BadRequestException, HttpException, HttpStatus, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, QuestionType } from '@prisma/client';
import { NotFoundError } from '@prisma/client/runtime';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class QuestionsService {
  private readonly logger = new Logger(QuestionsService.name);
  public static QUESTION_PROJECTION = { id: true, title: true, type: true, required: true, hasOther: true, regex: true, answers: { select: { id: true, title: true } }, nextQuestionId: true };

  constructor(private prisma: PrismaService) { }

  private handleQueryException(error: any, entity: string = 'Question') {
    Logger.error(error);
    if (error instanceof NotFoundError) {
      throw new NotFoundException()
    } else {
      throw new HttpException("An error has occured", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Adds a question into a section
   * @param title Question title
   * @param type Question type
   * @param sectionId Question section ID
   * @param required True if the question is required
   * @param hasOther True if the question should have a free field
   * @param previous ID of the question that comes before
   */
  async addQuestion(title: string, type: QuestionType, sectionId: number, required: boolean = false, hasOther?: boolean, regex?: string, previous?: number) {
    if (previous) {
      try {
        var previousQuestion = await this.prisma.question.findUniqueOrThrow({ where: { id: previous } });
        var emptySection = (await this.prisma.questionSection.findUniqueOrThrow({ where: { id: sectionId } }).questions()).length == 0
      } catch (error) {
        this.handleQueryException(error);
      }
      if (emptySection) {
        throw new BadRequestException("Previous question not found: Section is empty");
      }
    }
    return await this.prisma.question.create({
      data: {
        title,
        type,
        required,
        hasOther,
        regex,
        section: { connect: { id: sectionId } },
        // Add a previous question only if previous is mentioned
        ...(previous ? {
          previousQuestion: {
            connect: { id: previous }
          },
          // Change next question if previous is mentioned
          ...(previousQuestion.nextQuestionId ? {
            nextQuestion: {
              connect: { id: previousQuestion.nextQuestionId ?? undefined }
            }
          } : {})
        } : {}),
      }
    });
  }

  async getQuestionsBySection(sectionId: number) {
    try {
      const section = await this.prisma.questionSection.findUniqueOrThrow({ 
        where: { id: sectionId }, 
        include: {
          questions: { select: QuestionsService.QUESTION_PROJECTION }
        }
      });
      return section.questions;
    } catch (error) {
      this.handleQueryException(error, "Section");
    }
  }

  async getQuestionsBySectionInOrder(sectionId: number) {
    try {
      var firstQuestion = await this.prisma.question.findFirstOrThrow({ where: { section: { id: sectionId }, previousQuestion: null }, select: QuestionsService.QUESTION_PROJECTION });
      this.logger.debug(`First question: ${firstQuestion.id} - ${firstQuestion.title}`);
    } catch (error) {
      this.handleQueryException(error);
    }
    const results = [firstQuestion];
    let question = firstQuestion;
    while (question && question.nextQuestionId) {
      question = await this.prisma.question.findFirst({ where: { section: { id: sectionId }, id: question.nextQuestionId }, select: QuestionsService.QUESTION_PROJECTION });
      this.logger.debug(`Next question: ${question.id} - ${question.title}`);
      if (question)
        results.push(question);
    }
    return results;
  }

  async getQuestionById(sectionId: number, questionId: number) {
    try {
      return await this.prisma.question.findFirstOrThrow({ where: { id: questionId, sectionId }, include: { answers: true } });
    } catch (error) {
      this.handleQueryException(error);
    }
  }

  async editQuestion(sectionId: number, questionId: number, title?: string, type?: QuestionType, required?: boolean, hasOther?: boolean, previous?: number) {
    // First, update the previous question (if it exists) to point to the next question (if it exists)
    // Then, update the new previous question to point to this question and make this question point
    //        to the new next question


    // Get the question and the previous question
    try {
      var firstQuestion = await this.prisma.question.findFirst({ where: { previousQuestion: null } });
      var question = await this.prisma.question.findFirstOrThrow({ where: { section: { id: sectionId }, id: questionId }, include: { previousQuestion: true, nextQuestion: true } });
      if (previous)
        var newPrevious = await this.prisma.question.findFirstOrThrow({ where: { section: { id: sectionId }, id: previous }, include: { previousQuestion: true, nextQuestion: true } });
    } catch (error) {
      this.handleQueryException(error);
    }
    // Update the previous question
    if (previous && question.previousQuestion !== null)
      await this.prisma.question.update({
        where: { id: question.previousQuestion.id },
        data: { nextQuestionId: question.nextQuestionId }
      });

    // if (previous === null) {
    //   await this.prisma.question.update({

    //   });
    // }
  }

  async deleteQuestion(sectionId: number, questionId: number) {
    await this.prisma.question.deleteMany({ where: { id: questionId, sectionId } });
  }
}
