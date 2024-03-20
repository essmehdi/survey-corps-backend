import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException
} from "@nestjs/common";
import { Prisma, QuestionType } from "@prisma/client";
import { PrismaError } from "prisma-error-enum";
import { ResourceNotFoundException } from "src/common/exceptions/resource-not-found.exception";
import { PrismaService } from "src/prisma/prisma.service";
import { EmptyElementException } from "../common/exceptions/empty-element.exception";
import { SameElementException } from "../common/exceptions/same-element.exception";
import { WrongDataException } from "../common/exceptions/wrong-data.exception";

@Injectable()
export class QuestionsService {
  private readonly logger = new Logger(QuestionsService.name);
  private static ANSWERS_INCLUDE = {
    answers: true
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
    const question = await this.prisma.question.findFirst({
      where: { section: { id: sectionId }, conditions: { some: {} } },
      include: QuestionsService.ANSWERS_INCLUDE
    });
    if (!question) {
      throw new ResourceNotFoundException("Question");
    }
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
   *
   * @throws {ResourceNotFoundException} If previous question is not found
   */
  async addQuestion(
    title: string,
    type: QuestionType,
    sectionId: number,
    required: boolean = false,
    previous: number,
    description?: string,
    hasOther?: boolean,
    regex?: string
  ) {
    const questionData = {
      title,
      type,
      description,
      required,
      hasOther,
      regex,
      section: { connect: { id: sectionId } }
    };

    const emptySection =
      (
        await this.prisma.questionSection
          .findUniqueOrThrow({ where: { id: sectionId } })
          .questions()
      ).length === 0;

    if (emptySection && previous !== null) {
      // Trying to add to a previous section in an empty section
      throw new ResourceNotFoundException("Previous question");
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
      return await this.prisma.question.create({
        data: {
          ...questionData,
          nextQuestion: { connect: { id: firstQuestion.id } }
        }
      });
    }
  }

  /**
   * Gets questions in a section
   * @param sectionId The section ID
   * @returns Questions in the section
   *
   * @throws {ResourceNotFoundException} If the section is not found
   */
  async getQuestionsBySection(sectionId: number) {
    const section = await this.prisma.questionSection.findUnique({
      where: { id: sectionId },
      include: {
        questions: { include: QuestionsService.ANSWERS_INCLUDE }
      }
    });
    if (!section) {
      throw new ResourceNotFoundException("Section");
    }
    return section.questions;
  }

  /**
   * Gets questions in a section in order
   * @param sectionId The section ID
   * @returns Gets a section with its questions in order
   */
  async getQuestionsBySectionInOrder(sectionId: number) {
    const section = await this.prisma.questionSection.findUnique({
      where: { id: sectionId }
    });

    // Verify if section exists
    if (!section) {
      throw new ResourceNotFoundException(`Section ${sectionId}`);
    }

    var firstQuestion = await this.prisma.question.findFirst({
      where: { section: { id: sectionId }, previousQuestion: null },
      include: QuestionsService.ANSWERS_INCLUDE
    });
    if (!firstQuestion) {
      return [];
    }
    const results = [firstQuestion];
    let question = firstQuestion;
    while (question && question.nextQuestionId) {
      question = await this.prisma.question.findFirst({
        where: { section: { id: sectionId }, id: question.nextQuestionId },
        include: QuestionsService.ANSWERS_INCLUDE
      });
      if (question) results.push(question);
    }
    return results;
  }

  /**
   * Gets a question by its ID
   * @param sectionId The section ID
   * @param questionId The question ID
   * @returns The question
   */
  async getQuestionById(sectionId: number, questionId: number) {
    const question = await this.prisma.question.findFirst({
      where: { id: questionId, sectionId },
      include: { answers: true }
    });
    if (!question) {
      throw new ResourceNotFoundException(
        `Question ${questionId} in section ${sectionId}`
      );
    }
    return question;
  }

  /**
   * Reorders a question
   * @param sectionId The section ID
   * @param questionId The question ID
   * @param previous The new previous question ID
   *
   * @throws {SameElementException} If the question and the new previous question are the same
   * @throws {ResourceNotFoundException} If the question or the new previous question are not found
   * @throws {EmptyElementException} If the section is empty
   */
  async reorderQuestion(
    sectionId: number,
    questionId: number,
    previous: number
  ) {
    // Check if previous is different from questionId
    if (questionId === previous) {
      throw new SameElementException(
        "Question and new previous question are the same"
      );
    }
    const question = await this.prisma.question.findFirst({
      where: { section: { id: sectionId }, id: questionId },
      include: {
        previousQuestion: true,
        nextQuestion: true
      }
    });
    if (!question) {
      throw new ResourceNotFoundException(
        `Question ${questionId} in section ${sectionId}`
      );
    }
    const firstQuestion = await this.prisma.question.findFirst({
      where: { section: { id: sectionId }, previousQuestion: null }
    });
    if (!firstQuestion) {
      throw new EmptyElementException("Empty section");
    }

    if ((question.previousQuestion?.id ?? null) === previous) {
      // No change
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      /**
       * Disconnect question and reconnect the previous question with the next question
       */
      if (question.previousQuestion !== null) {
        await tx.question.update({
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
        await tx.question.update({
          where: { id: questionId },
          data: {
            nextQuestion: {
              connect: {
                id: firstQuestion.id
              }
            }
          }
        });
      } else {
        /**
         * Get the new previous and make its next question the current question's next question
         */
        const newPrevious = await tx.question.findFirst({
          where: { section: { id: sectionId }, id: previous },
          include: {
            nextQuestion: true
          }
        });

        // Check if the new previous question exists
        if (!newPrevious) {
          throw new ResourceNotFoundException(
            `Question ${previous} in section ${sectionId}`
          );
        }

        await tx.question.update({
          where: { id: newPrevious.id },
          data: {
            nextQuestion: {
              connect: {
                id: question.id
              }
            }
          }
        });

        await tx.question.update({
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

  /**
   * Edits a question
   * @param sectionId The section ID
   * @param questionId The question ID
   * @param title The new title
   * @param description The new description
   * @param type The new type
   * @param required The new required
   * @param hasOther The new hasOther
   * @param regex The new regex
   * @returns The edited question
   *
   * @throws {ResourceNotFoundException} If the question is not found
   * @throws {WrongDataException} If the regex is set for a non FREEFIELD question or if the question is linked to a condition and is not required
   */
  async editQuestion(
    sectionId: number,
    questionId: number,
    title?: string,
    description?: string,
    type?: QuestionType,
    required?: boolean,
    hasOther?: boolean,
    regex?: string | null
  ) {
    const question = await this.prisma.question.findFirst({
      where: { sectionId, id: questionId }
    });

    // Check if question exists
    if (!question) {
      throw new ResourceNotFoundException(
        `Question ${questionId} in section ${sectionId}`
      );
    }

    if (
      regex &&
      ((type && type !== QuestionType.FREEFIELD) ||
        (!type && question.type !== QuestionType.FREEFIELD))
    ) {
      throw new WrongDataException(
        "Regex can only be set for freefield questions"
      );
    }

    const condition = await this.prisma.condition.findFirst({
      where: { question: { id: question.id } }
    });

    // Conditional questions must be required
    if (condition && required === false) {
      throw new WrongDataException(
        "This question is linked to a condition. It must be required"
      );
    }

    if (regex === "") regex = null;

    return await this.prisma.$transaction(async (tx) => {
      if (question.type === QuestionType.FREEFIELD && hasOther)
        hasOther = false;

      await tx.question.updateMany({
        where: { sectionId, id: questionId },
        data: {
          title,
          type,
          description,
          required,
          hasOther,
          regex
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
  }

  /**
   * Deletes a question
   * @param sectionId The section ID
   * @param questionId The question ID
   *
   * @throws {ResourceNotFoundException} If the question is not found
   */
  async deleteQuestion(sectionId: number, questionId: number) {
    const question = await this.prisma.question.findFirst({
      where: { id: questionId, sectionId },
      include: {
        nextQuestion: true,
        previousQuestion: true
      }
    });

    if (!question) {
      throw new ResourceNotFoundException(
        `Question ${questionId} in section ${sectionId}`
      );
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
