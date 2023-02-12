import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException
} from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { ConditionDto } from "./dto/ChangeNextSectionDto";
import { QuestionsService } from "../questions/questions.service";
import { Prisma, QuestionSection } from "@prisma/client";
import { NotFoundError } from "@prisma/client/runtime";
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
          next.answers[condition.answerId] = condition.nextSectionId;
        });
      }
    }
    return next;
  }

  /**
   * Gets all registered sections in the database without their questions
   */
  async allSections() {
    return await this.prisma.questionSection.findMany({});
  }

  /**
   * Gets all registered sections in the database with their questions in order
   */
  async allSectionsWithOrderedQuestions() {
    const sections = await this.prisma.questionSection.findMany({});
    const result = await Promise.all(
      sections.map(async (section) => {
        delete section["nextSectionId"];
        return {
          ...section,
          questions: await this.questions.getQuestionsBySectionInOrder(
            section.id
          ),
          next: await this.getSectionNext(section)
        };
      })
    );
    return result;
  }

  /**
   * Adds a new section in database
   * @param title Title of the section
   * @returns
   */
  async addSection(title: string) {
    return await this.prisma.questionSection.create({ data: { title } });
  }

  /**
   * Gets the first section of the form
   */
  async firstSection() {
    try {
      const firstSection = await this.prisma.questionSection.findFirstOrThrow({
        where: { previousSection: null, conditioned: { none: {} } }
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
   */
  async editSection(sectionId: number, title: string) {
    await this.prisma.questionSection.update({
      where: { id: sectionId },
      data: { title }
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
   * @param nextSection ID of the next section
   */
  async setSectionNext(id: number, nextSection: number) {
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.condition.deleteMany({
          where: {
            question: {
              section: { id },
              conditions: { some: {} }
            }
          }
        });

        return await tx.questionSection.update({
          where: { id },
          data: {
            nextSection: {
              connect: {
                id: nextSection
              }
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
      if (conditioned)
        throw new ConflictException(
          "A conditional question already exists for this section"
        );

      // Validate the input
      const question = await this.prisma.question.findFirstOrThrow({
        where: { id: condition.question, section: { id } },
        include: { answers: true, section: true }
      });
      const answersIds = question.answers.map((a) => a.id);
      if (
        !Object.keys(condition.answers).every((answer) =>
          answersIds.includes(+answer)
        )
      ) {
        throw new NotFoundException(
          "The answers provided could not be found in the question provided"
        );
      }

      // Create the conditions
      await this.prisma.$transaction(async (tx) => {
        await tx.condition.createMany({
          data: Object.entries(condition.answers).map(([answer, section]) => {
            return {
              nextSectionId: section,
              answerId: +answer,
              questionId: condition.question
            };
          })
        });

        if (question.section.nextSectionId) {
          await tx.questionSection.update({
            where: { id },
            data: {
              nextSection: {
                delete: true
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
