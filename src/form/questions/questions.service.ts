import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException
} from "@nestjs/common";
import { Prisma, QuestionType } from "@prisma/client";
import { PrismaError } from "prisma-error-enum";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class QuestionsService {
  private readonly logger = new Logger(QuestionsService.name);
  public static QUESTION_PROJECTION = {
    id: true,
    title: true,
    type: true,
    required: true,
    hasOther: true,
    regex: true,
    answers: { select: { id: true, title: true } },
    nextQuestionId: true
  };

  constructor(private prisma: PrismaService) {}

  private handleQueryException(error: any, entity: string = "question") {
    this.logger.error(error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === PrismaError.RecordDoesNotExist)
        throw new NotFoundException(`The requested ${entity} does not exist`);
      else if (
        error.code === PrismaError.ForeignConstraintViolation &&
        (error.meta.field_name as string).includes("Condition_answerId_fkey")
      ) {
        throw new ConflictException(
          "You cannot change the type of this question because it is used as a condition for the next section"
        );
      } else if (error.code === PrismaError.RecordsNotFound)
        throw new NotFoundException(`The requested ${entity} was not found`);
    }
    throw new InternalServerErrorException("An error has occured");
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
  async addQuestion(
    title: string,
    type: QuestionType,
    sectionId: number,
    required: boolean = false,
    previous: number,
    hasOther?: boolean,
    regex?: string
  ) {
    const questionData = {
      title,
      type,
      required,
      hasOther,
      regex,
      section: { connect: { id: sectionId } }
    };
    try {
      const emptySection =
        (
          await this.prisma.questionSection
            .findUniqueOrThrow({ where: { id: sectionId } })
            .questions()
        ).length === 0;
      Logger.debug(emptySection);
      if (emptySection && previous !== null) {
        // Trying to add to a previous section in an empty section
        throw new NotFoundException(
          "Previous question was not found: Section is empty"
        );
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
            ...(previousQuestion.nextQuestionId
              ? {
                  nextQuestion: {
                    connect: { id: previousQuestion.nextQuestionId }
                  }
                }
              : {})
          }
        });
      } else {
        // !emptySection && previous === null
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
      var firstQuestion = await this.prisma.question.findFirstOrThrow({
        where: { section: { id: sectionId }, previousQuestion: null },
        select: QuestionsService.QUESTION_PROJECTION
      });
      Logger.debug(firstQuestion.title);
    } catch (error) {
      this.handleQueryException(error);
    }
    const results = [firstQuestion];
    let question = firstQuestion;
    while (question && question.nextQuestionId) {
      question = await this.prisma.question.findFirst({
        where: { section: { id: sectionId }, id: question.nextQuestionId },
        select: QuestionsService.QUESTION_PROJECTION
      });
      if (question) results.push(question);
    }
    return results;
  }

  async getQuestionById(sectionId: number, questionId: number) {
    try {
      return await this.prisma.question.findFirstOrThrow({
        where: { id: questionId, sectionId },
        include: { answers: true }
      });
    } catch (error) {
      this.handleQueryException(error);
    }
  }

  async reorderQuestion(
    sectionId: number,
    questionId: number,
    previous: number
  ) {
    const question = await this.prisma.question.findFirstOrThrow({
      where: { section: { id: sectionId }, id: questionId },
      include: {
        previousQuestion: true,
        nextQuestion: true
      }
    });

    if (question.previousQuestion.id === previous) {
      // No change
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      /**
       * Disconnect question and reconnect the previous question with the next question
       */
      if (question.previousQuestion !== null) {
        await this.prisma.question.update({
          where: { id: question.previousQuestion.id },
          data: {
            nextQuestion: {
              ...(question.nextQuestion !== null
                ? {
                    connect: {
                      id: question.nextQuestion.id
                    }
                  }
                : { disconnect: true })
            }
          }
        });
      }

      if (previous === null) {
        /**
         * Place it as first question if previous is null
         */
        const firstQuestion = await this.prisma.question.findFirstOrThrow({
          where: { section: { id: sectionId }, previousQuestion: null }
        });

        await this.prisma.question.update({
          where: { id: questionId },
          data: {
            nextQuestion: {
              connect: firstQuestion
            }
          }
        });
      } else {
        /**
         * Get the new previous and make its next question the current question's next question
         */
        const newPrevious = await this.prisma.question.findFirstOrThrow({
          where: { section: { id: sectionId }, id: previous },
          include: {
            nextQuestion: true
          }
        });

        await this.prisma.question.update({
          where: { id: newPrevious.id },
          data: {
            nextQuestion: {
              connect: {
                id: question.id
              }
            }
          }
        });

        await this.prisma.question.update({
          where: { id: question.id },
          data: {
            nextQuestion: {
              ...(newPrevious.nextQuestion !== null
                ? {
                    connect: {
                      id: newPrevious.nextQuestion.id
                    }
                  }
                : { disconnect: true })
            }
          }
        });
      }
    });
  }

  async editQuestion(
    sectionId: number,
    questionId: number,
    title?: string,
    type?: QuestionType,
    required?: boolean,
    hasOther?: boolean,
    regex?: string
  ) {
    try {
      const question = await this.prisma.question.findFirst({
        where: { sectionId, id: questionId }
      });

      if (
        regex &&
        ((type && type !== QuestionType.FREEFIELD) ||
          (!type && question.type !== QuestionType.FREEFIELD))
      ) {
        throw new BadRequestException(
          "Regex can only be set for freefield questions"
        );
      }

      return await this.prisma.$transaction(async (tx) => {
        if (question.type === QuestionType.FREEFIELD && hasOther)
          hasOther = false;

        await tx.question.updateMany({
          where: { sectionId, id: questionId },
          data: {
            ...(typeof title === "string" ? { title } : {}),
            ...(typeof type === "string" ? { type } : {}),
            ...(typeof required === "boolean" ? { required } : {}),
            ...(typeof hasOther === undefined ? { hasOther } : {}),
            ...(typeof regex === "string" ? { regex } : {})
          }
        });

        if (type === QuestionType.FREEFIELD) {
          await tx.answer.deleteMany({
            where: { questionId }
          });
        }

        return await tx.question.findFirst({
          where: { sectionId, id: questionId }
        });
      });
    } catch (error) {
      this.handleQueryException(error);
    }
  }

  async deleteQuestion(sectionId: number, questionId: number) {
    const question = await this.prisma.question.findFirst({
      where: { id: questionId, sectionId },
      include: {
        nextQuestion: true,
        previousQuestion: true
      }
    });

    if (!question) {
      throw new NotFoundException("Question not found");
    }

    if (!question.nextQuestion && !question.previousQuestion) {
      await this.prisma.question.delete({
        where: { id: questionId }
      });
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      if (question.previousQuestion) {
        await tx.question.update({
          where: { id: question.previousQuestion.id },
          data: {
            nextQuestion: {
              ...(question.nextQuestion !== null
                ? {
                    connect: { id: question.nextQuestion.id }
                  }
                : { disconnect: true })
            }
          }
        });
      }

      await tx.question.deleteMany({
        where: { id: questionId, sectionId }
      });
    });
  }
}
