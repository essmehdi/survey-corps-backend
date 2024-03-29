import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { ConditionDto } from "./dto/change-next-section.dto";
import { QuestionsService } from "../questions/questions.service";
import { QuestionSection, QuestionType } from "@prisma/client";
import { PrismaError } from "prisma-error-enum";
import { ResourceNotFoundException } from "src/common/exceptions/resource-not-found.exception";
import { SameElementException } from "../common/exceptions/same-element.exception";
import { WrongDataException } from "../common/exceptions/wrong-data.exception";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

@Injectable()
export class SectionsService {
  private readonly logger = new Logger(SectionsService.name);

  constructor(
    private prisma: PrismaService,
    private questions: QuestionsService
  ) {}

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
          next.answers[condition.answerId ?? "other"] = condition.nextSectionId;
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
   *
   * @throws {ResourceNotFoundException} If the section is not found
   */
  async firstSection() {
    const firstSection = await this.prisma.questionSection.findFirst({
      where: { previousSections: { none: {} }, conditioned: { none: {} } }
    });
    if (!firstSection) {
      throw new ResourceNotFoundException("Section");
    }
    return this.getSection(firstSection.id);
  }

  /**
   * Gets a specific section by ID with questions in order
   * @param sectionId ID of the section
   *
   * @throws {ResourceNotFoundException} If the section is not found
   */
  async getSection(sectionId: number) {
    const result = await this.prisma.questionSection.findUnique({
      where: { id: sectionId }
    });

    if (!result) {
      throw new ResourceNotFoundException(`Section ${sectionId}`);
    }

    const next = this.getSectionNext(result);

    return {
      ...result,
      questions: await this.questions.getQuestionsBySectionInOrder(sectionId),
      next
    };
  }

  /**
   * Changes section details
   * @param sectionId ID of the section
   * @param title New title for the section
   * @param description New description for the section
   *
   * @throws {ResourceNotFoundException} If the section is not found
   */
  async editSection(sectionId: number, title?: string, description?: string) {
    if (description === "") description = null;
    try {
      const updatedSection = await this.prisma.questionSection.update({
        where: { id: sectionId },
        data: { title, description }
      });
      return updatedSection;
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === PrismaError.RecordDoesNotExist
      ) {
        throw new ResourceNotFoundException(`Section ${sectionId}`);
      }
      throw error;
    }
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
   *
   * @throws {ResourceNotFoundException} If the section is not found
   * @throws {SameElementException} If the section points to itself
   */
  async setSectionNext(id: number, nextSectionId: number | null) {
    const section = await this.prisma.questionSection.findUniqueOrThrow({
      where: { id }
    });

    if (nextSectionId) {
      const nextSection = await this.prisma.questionSection.findUnique({
        where: { id: nextSectionId }
      });

      // Check if the section exists
      if (!nextSection) {
        throw new ResourceNotFoundException(`Section ${nextSectionId}`);
      }

      // Check if the sections are not the same
      if (nextSection.id === section.id) {
        throw new SameElementException(
          "You cannot point to the section itself"
        );
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.condition.deleteMany({
        where: {
          question: {
            section: { id }
          }
        }
      });

      await tx.questionSection.update({
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
  }

  /**
   * Sets the next section conditionnally based on the answer
   * @param id ID of the section to change
   * @param condition The conditions and target sections
   *
   * @throws {ResourceNotFoundException} If section, question or one of the answer is not found
   * @throws {WrongDataException} If data in condition is not valid
   * @throws {SameElementException} If the section points to itself
   */
  async setConditionNext(id: number, condition: ConditionDto) {
    // Check if there is not already a conditional question in section
    const conditioned = await this.prisma.question.findFirst({
      where: { conditions: { some: {} }, section: { id } }
    });

    // Validate the input
    const question = await this.prisma.question.findFirst({
      where: { id: condition.question, section: { id } },
      include: { answers: true, section: true }
    });

    if (!question) {
      throw new ResourceNotFoundException(`Question ${condition.question}`);
    }

    // Check if question is single choice
    if (question.type !== QuestionType.SINGLE_CHOICE) {
      throw new WrongDataException(
        "The question provided is not a single choice question"
      );
    }

    // Check if answers are correct
    const answersIds: (number | "other")[] = question.answers.map((a) => a.id);

    if (question.hasOther) {
      answersIds.push("other"); // -1 represents the "other" answer
    }

    // Check if all answers are provided
    const providedAnswers = Object.keys(condition.answers);

    if (providedAnswers.length !== answersIds.length) {
      throw new WrongDataException(
        "The number of answers provided does not match the number of answers in the question"
      );
    }

    if (
      !providedAnswers.every((answer) => {
        // Check if any answer does point to the same question section
        if (condition.answers[answer] === question.section.id)
          throw new SameElementException(
            "You cannot point on the section itself"
          );
        return answersIds.includes(answer !== "other" ? +answer : "other");
      })
    ) {
      throw new ResourceNotFoundException("Answer");
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
            answerId: answer !== "other" ? +answer : null,
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
  }
}
