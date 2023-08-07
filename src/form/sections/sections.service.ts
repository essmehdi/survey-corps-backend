import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException
} from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { ConditionDto } from "./dto/change-next-section.dto";
import { QuestionsService } from "../questions/questions.service";
import { Prisma, QuestionSection, QuestionType } from "@prisma/client";
import { PrismaError } from "prisma-error-enum";

@Injectable()
export class SectionsService {
  private readonly logger = new Logger(SectionsService.name);

  constructor(
    private prisma: PrismaService,
    private questions: QuestionsService
  ) {}

  private handleQueryException(error: any, entity: string = "section") {
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
   * Gets the next section or the conditions for next sections
   * @param section The section object to search next for
   */
  private async getSectionNext(section: QuestionSection) {
    var next = null;
    if (section.nextSectionId) {
      next = section.nextSectionId;
    } else {
      const conditions = await this.prisma.condition.findMany({
        where: { question: { section: { id: section.id } } }
      });
      if (conditions.length > 0) {
        next = {
          question: conditions[0].questionId,
          answers: {}
        };
        conditions.forEach((condition) => {
          next.answers[condition.answerId ?? -1] = condition.nextSectionId;
        });
      }
    }
    return next;
  }

  /**
   * Gets all registered sections in the database without their questions
   */
  async allSections() {
    return await this.prisma.questionSection.findMany({
      orderBy: {
        id: "asc"
      }
    });
  }

  /**
   * Gets all registered sections in the database with their questions in order
   */
  async allSectionsWithOrderedQuestions() {
    const sections = await this.prisma.questionSection.findMany({
      orderBy: {
        id: "asc"
      }
    });
    const result = await Promise.all(
      sections.map(async (section) => {
        const finalSection = {
          ...section,
          questions: await this.questions.getQuestionsBySectionInOrder(
            section.id
          ),
          next: await this.getSectionNext(section)
        };
        delete finalSection["nextSectionId"];
        return finalSection;
      })
    );
    return result;
  }

  /**
   * Adds a new section in database
   * @param title Title of the section
   * @param description Description of the section
   * @returns Newly created section
   */
  async addSection(title: string, description?: string) {
    if (description === "") description = null;
    return await this.prisma.questionSection.create({
      data: {
        title,
        description: description ?? null
      }
    });
  }

  /**
   * Gets the first section of the form
   */
  async firstSection() {
    try {
      const firstSection = await this.prisma.questionSection.findFirstOrThrow({
        where: { previousSections: { none: {} }, conditioned: { none: {} } }
      });
      return this.section(firstSection.id);
    } catch (error) {
      return new InternalServerErrorException(
        "Could not determine first section"
      );
    }
  }

  /**
   * Gets a specific section by ID with questions in order
   * @param sectionId ID of the section
   */
  async section(sectionId: number) {
    try {
      const result = await this.prisma.questionSection.findUniqueOrThrow({
        where: { id: sectionId }
      });

      const next = this.getSectionNext(result);
      const { nextSectionId, ...strippedResult } = result;

      return {
        ...strippedResult,
        questions: await this.questions.getQuestionsBySectionInOrder(sectionId),
        next
      };
    } catch (error) {
      this.handleQueryException(error);
    }
  }

  /**
   * Changes section details
   * @param sectionId ID of the section
   * @param title New title for the section
   * @param description New description for the section
   */
  async editSection(sectionId: number, title?: string, description?: string) {
    if (description === "") description = null;
    await this.prisma.questionSection.update({
      where: { id: sectionId },
      data: { title, description }
    });

    return await this.prisma.questionSection.findUnique({
      where: { id: sectionId }
    });
  }

  /**
   * Removes a section by ID
   * @param sectionId ID of the section
   */
  async deleteSection(sectionId: number) {
    await this.prisma.questionSection.delete({ where: { id: sectionId } });
  }

  /**
   * Sets the next section directly to another section
   * @param id ID of the target section
   * @param nextSectionId ID of the next section
   */
  async setSectionNext(id: number, nextSectionId: number | null) {
    const section = await this.prisma.questionSection.findUniqueOrThrow({
      where: { id }
    });

    if (nextSectionId) {
      const nextSection = await this.prisma.questionSection.findUniqueOrThrow({
        where: { id: nextSectionId }
      });

      if (nextSection.id === section.id) {
        throw new ConflictException("You cannot point to the section itself");
      }
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.condition.deleteMany({
          where: {
            question: {
              section: { id }
            }
          }
        });

        return await tx.questionSection.update({
          where: { id },
          data: {
            nextSection: {
              ...(nextSectionId === null
                ? { disconnect: true }
                : {
                    connect: {
                      id: nextSectionId
                    }
                  })
            }
          }
        });
      });
    } catch (error) {
      this.handleQueryException(error);
    }
  }

  /**
   * Sets the next section conditionnally based on the answer
   * @param id ID of the section to change
   * @param condition The conditions and target sections
   */
  async setConditionNext(id: number, condition: ConditionDto) {
    try {
      // Check if there is not already a conditional question in section
      const conditioned = await this.prisma.question.findFirst({
        where: { conditions: { some: {} }, section: { id } }
      });

      // Validate the input
      const question = await this.prisma.question.findFirstOrThrow({
        where: { id: condition.question, section: { id } },
        include: { answers: true, section: true }
      });

      // Check if question is single choice
      if (question.type !== QuestionType.SINGLE_CHOICE) {
        throw new BadRequestException(
          "The question provided is not a single choice question"
        );
      }

      // Check if answers are correct
      const answersIds = question.answers.map((a) => a.id);

      if (question.hasOther) {
        answersIds.push(-1); // -1 represents the "other" answer
      }

      // Check if all answers are provided
      const answers = Object.keys(condition.answers);

      if (answers.length !== answersIds.length) {
        throw new BadRequestException(
          "The number of answers provided does not match the number of answers in the question"
        );
      }

      if (
        !answers.every((answer) => {
          // Check if any answer does point to the same question section
          if (condition.answers[answer] === question.section.id)
            throw new ConflictException(
              "You cannot point on the section itself"
            );
          return answersIds.includes(+answer);
        })
      ) {
        throw new NotFoundException(
          "The answers provided could not be found in the question provided"
        );
      }

      // Create the conditions
      await this.prisma.$transaction(async (tx) => {
        if (conditioned) {
          await tx.condition.deleteMany({
            where: {
              question: {
                section: { id }
              }
            }
          });
        }

        await tx.question.update({
          where: { id: condition.question },
          data: {
            required: true
          }
        });

        await tx.condition.createMany({
          data: Object.entries(condition.answers).map(([answer, section]) => {
            return {
              nextSectionId: section,
              answerId: answer !== "-1" ? +answer : null,
              questionId: condition.question
            };
          })
        });

        if (question.section.nextSectionId) {
          await tx.questionSection.update({
            where: { id },
            data: {
              nextSection: {
                disconnect: true
              }
            }
          });
        }
      });

      return {
        message: "Conditions added successfully"
      };
    } catch (error) {
      this.handleQueryException(error);
    }
  }
}
