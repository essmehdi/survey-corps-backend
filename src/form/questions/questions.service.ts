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
    this.logger.error(error);
    if (error instanceof NotFoundError) {
      throw new NotFoundException()
    } else {
      throw new HttpException("An error has occured", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Gets the conditional question associated to a section
   * @param sectionId Section ID
   */
  async getConditionalQuestion(sectionId: number) {
    return await this.prisma.question.findFirst({
      where: { section: { id: sectionId }, conditions: { some: {} } }
    });
  }

  /**
   * Adds a question into a section
   * @param title Question title
   * @param type Question type
   * @param sectionId Question section ID
   * @param required True if the question is required
   * @param previous ID of the question that comes before
   * @param hasOther True if the question should have a free field
   * @param regex Regular expression to validate input in case of a FREEFIELD question
   */
  async addQuestion(title: string, type: QuestionType, sectionId: number, required: boolean = false, previous: number, hasOther?: boolean, regex?: string) {
    const questionData = { title, type, required, hasOther, regex, section: { connect: { id: sectionId } } };
    try {
      const emptySection = (await this.prisma.questionSection.findUniqueOrThrow({ where: { id: sectionId } }).questions()).length === 0;
      Logger.debug(emptySection);
      if (emptySection && previous !== null) {
        // Trying to add to a previous section in an empty section
        throw new NotFoundException("Previous question was not found: Section is empty");
      } else if (emptySection && previous === null) {
        // Empty section so this will be the first question to be created
        return await this.prisma.question.create({
          data: questionData
        });
      } else if (!emptySection && previous !== null) {
        // Place question
        const previousQuestion = await this.prisma.question.findUniqueOrThrow({
          where: { id: previous }
        });
        return await this.prisma.question.create({
          data: {
            ...questionData,
            previousQuestion: { connect: { id: previousQuestion.id } },
            ...(previousQuestion.nextQuestionId ? {
              nextQuestion: {
                connect: { id: previousQuestion.nextQuestionId }
              }
            } : {})
          }
        });
      } else { // !emptySection && previous === null
        // Place question at the first position
        const firstQuestion = await this.prisma.question.findFirstOrThrow({
          where: { section: { id: sectionId }, previousQuestion: null }
        });
        Logger.debug(firstQuestion);
        return await this.prisma.question.create({
          data: {
            ...questionData,
            nextQuestion: { connect: { id: firstQuestion.id } }
          }
        });
      }
    } catch (error) {
      this.handleQueryException(error);
    }
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
      Logger.debug(firstQuestion.title);
    } catch (error) {
      this.handleQueryException(error);
    }
    const results = [firstQuestion];
    let question = firstQuestion;
    while (question && question.nextQuestionId) {
      question = await this.prisma.question.findFirst({ where: { section: { id: sectionId }, id: question.nextQuestionId }, select: QuestionsService.QUESTION_PROJECTION });
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

  // TODO: Complete the reordering logic
  async reorderQuestion(sectionId: number, questionId: number, previous: number) {
    const question = await this.prisma.question.findFirst({ where: { sectionId, id: questionId }, include: { previousQuestion: true } });
  }

  async editQuestion(sectionId: number, questionId: number, title?: string, type?: QuestionType, required?: boolean, hasOther?: boolean) {
    const question = await this.prisma.question.findFirst({ where: { sectionId, id: questionId } });

    if (question.type === QuestionType.FREEFIELD && hasOther)
      hasOther = false;

    try {
      await this.prisma.question.updateMany({
        where: { sectionId, id: questionId },
        data: {
          ...(title ? { title } : {} ),
          ...(type ? { type } : {} ),
          ...(required ? { required } : {} ),
          ...(hasOther ? { hasOther } : {} )
        }
      });
    } catch (error) {
      this.handleQueryException(error);
    }
  }

  async deleteQuestion(sectionId: number, questionId: number) {
    await this.prisma.question.deleteMany({ where: { id: questionId, sectionId } });
  }
}
