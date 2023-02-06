import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException
} from "@nestjs/common";
import {
  Prisma,
  PrismaClient,
  Question,
  QuestionSection,
  QuestionType
} from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";
import { AddSubmissionDto } from "./dto/AddSubmissionDto";
import { Submission } from "./dto/Submission";

@Injectable()
export class SubmissionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Submission helper function to add a single answer
   * @param tx The transaction client
   * @param token The submission token
   * @param answer The answer object
   */
  private async addSingleAnswerSubmission(
    tx: Prisma.TransactionClient,
    token: string,
    answer: Submission
  ) {
    const { questionId, answerId } = answer;
    await tx.token.update({
      where: { token },
      data: {
        submissions: {
          create: {
            question: { connect: { id: questionId } },
            answer: { connect: { id: answerId as number } }
          }
        }
      }
    });
  }

  /**
   * Submission helper function to add multiple answers for a question
   * @param tx The transaction client
   * @param token The submission token
   * @param answer The answer object
   */
  private async addMultipleAnswersSubmission(
    tx: Prisma.TransactionClient,
    token: string,
    answer: Submission
  ) {
    const { questionId, answerId } = answer;
    await tx.token.update({
      where: { token },
      data: {
        submissions: {
          createMany: {
            data: (answerId as number[]).map((it) => ({
              questionId,
              answerId: it
            }))
          }
        }
      }
    });
  }

  /**
   * Submission helper function to add an other answer
   * @param tx The transaction client
   * @param token The submission token
   * @param answer The answer object
   */
  private async addOtherAnswerSubmission(
    tx: Prisma.TransactionClient,
    token: string,
    answer: Submission
  ) {
    const { questionId, other } = answer;
    await tx.token.update({
      where: { token },
      data: {
        submissions: {
          create: {
            question: { connect: { id: questionId } },
            other
          }
        }
      }
    });
  }

  private validateOtherAnswer(
    question: Partial<Question>,
    otherAnswer: string
  ) {
    if (question.regex) {
      if (!new RegExp(question.regex).test(otherAnswer))
        throw new BadRequestException(
          `Answer for question #${question.id} does not match the regular expression`
        );
    }
  }

  private async validateSubmission(answers: Submission[], token: string) {
    await this.prisma.$transaction(async (tx) => {
      var currentSection: QuestionSection = null;
      var nextSectionId = null;

      var nextQuestionId = null;

      for (const answer of answers) {
        /**
         * Enter new section if it is the first and matches the first section in the database
         * or matches the next section and there is no more questions in the previous section
         */
        if (
          !currentSection ||
          (currentSection.id !== answer.sectionId &&
            !nextQuestionId &&
            nextSectionId === answer.sectionId)
        ) {
          const section = await this.prisma.questionSection.findUnique({
            where: { id: answer.sectionId },
            include: {
              previousSection: true,
              nextSection: true,
              conditioned: true
            }
          });

          // Check if section exists
          if (!section)
            throw new NotFoundException(
              `Section #${answer.sectionId} does not exist`
            );

          // Check if the section is the first element of the submission matches with the database
          if (
            !currentSection &&
            (section.previousSection || section.conditioned.length > 0)
          )
            throw new BadRequestException(
              `Section #${answer.sectionId} is not the first`
            );

          currentSection = section;
          if (section.nextSection) nextSectionId = section.nextSection.id;
          else nextSectionId = null;
        }

        // Get the current question
        const question = await this.prisma.question.findFirst({
          where: { id: answer.questionId, sectionId: answer.sectionId },
          include: { nextQuestion: true, conditions: true }
        });
        if (!question)
          throw new NotFoundException(
            `Question #${answer.questionId} on section #${answer.sectionId} does not exist`
          );
        if (nextQuestionId && nextQuestionId !== question.id)
          throw new BadRequestException(
            `Bad question #${question.id} positioning`
          );

        // Check if question is required
        if (!answer.answerId && !answer.other) {
          if (question.required)
            throw new BadRequestException(
              `Question #${question.id} is required`
            );
        } else {
          // Validate answers
          if (question.type !== QuestionType.FREEFIELD) {
            const answers = (
              await this.prisma.answer.findMany({
                where: { question: { id: question.id } },
                select: { id: true }
              })
            ).map((it) => it.id);
            if (question.type === QuestionType.SINGLE_CHOICE) {
              // Check if an answer or other field is provided
              if (
                (answer.answerId && answer.other) ||
                (!answer.answerId && !answer.other)
              )
                throw new ConflictException(
                  `One of 'answerId' and 'other' is required and not both`
                );
              if (answer.answerId) {
                if (typeof answer.answerId !== "number")
                  throw new BadRequestException(
                    `'answerId' must be a number in question #${question.id}`
                  );
                if (!answers.includes(answer.answerId)) {
                  throw new NotFoundException(
                    `Answer #${answer.answerId} on question #${answer.questionId} does not exist`
                  );
                }
                await this.addSingleAnswerSubmission(tx, token, answer);
              } else {
                if (question.regex) {
                  if (!new RegExp(question.regex).test(answer.other))
                    throw new BadRequestException(
                      `Answer for question #${question.id} does not match the regular expression`
                    );
                }
                await this.addOtherAnswerSubmission(tx, token, answer);
              }
            } else {
              if (!Array.isArray(answer.answerId))
                throw new BadRequestException(
                  `Question #${question.id} is a multiple choice question. Answer must be an array`
                );
              if (
                answer.answerId.length === 0 ||
                !answer.answerId.every((it) => answers.includes(it))
              )
                throw new NotFoundException(
                  `An answer provided on question #${answer.questionId} does not exist`
                );
              await this.addMultipleAnswersSubmission(tx, token, answer);
              if (answer.other) {
                this.validateOtherAnswer(question, answer.other);
                await this.addOtherAnswerSubmission(tx, token, answer);
              }
            }
          } else {
            this.validateOtherAnswer(question, answer.other);
            await this.addOtherAnswerSubmission(tx, token, answer);
          }
        }

        if (question.nextQuestion) {
          nextQuestionId = question.nextQuestion.id;
        } else {
          nextQuestionId = null;
        }
      }
    });

    return true;
  }

  async addSubmission(addSubmissionDto: AddSubmissionDto) {
    try {
      // Check if token exists
      var tokens = await this.prisma.token.findUniqueOrThrow({
        where: { token: addSubmissionDto.token },
        include: { submissions: true }
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new ForbiddenException("Missing or invalid token");
      }
    }
    // Check if the token has already been used to submit
    if (tokens.submissions.length > 0) {
      throw new ConflictException("The submission token has already been used");
    }
    return {
      valid: await this.validateSubmission(
        addSubmissionDto.submissions,
        addSubmissionDto.token
      )
    };
  }
}
