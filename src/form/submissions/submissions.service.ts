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

        if (question.type !== QuestionType.FREEFIELD) {
          const answers = (
            await this.prisma.answer.findMany({
              where: { question: { id: question.id } },
              select: { id: true }
            })
          ).map((it) => it.id);
          if (question.type === QuestionType.SINGLE_CHOICE) {
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
              Logger.debug(answers);
              if (!answers.includes(answer.answerId)) {
                throw new NotFoundException(
                  `Answer #${answer.answerId} on question #${answer.questionId} does not exist`
                );
              }
            } else {
              if (question.regex) {
                if (!new RegExp(question.regex).test(answer.other))
                  throw new BadRequestException(
                    `Answer for question #${question.id} does not match the regular expression`
                  );
              }
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
            if (answer.other) {
              this.validateOtherAnswer(question, answer.other);
            }
          }
        } else {
          this.validateOtherAnswer(question, answer.other);
        }

        // Validate the answer
        // if (answer.answerId && !answer.other) {
        //   const questionAnswer = await this.prisma.answer.findFirst({
        //     where: { id: answer.answerId, questionId: question.id }
        //   });
        //   if (!questionAnswer)
        //     throw new NotFoundException(
        //       `Answer #${answer.answerId} on question #${answer.questionId} does not exist`
        //     );

        //   if (question.conditions.length) {
        //     if (nextSectionId)
        //       throw new UnprocessableEntityException(`Form integrity error`);
        //     const verifiedCondition = question.conditions.find(
        //       (condition) => condition.answerId === questionAnswer.id
        //     );
        //     nextSectionId =
        //       verifiedCondition?.nextSectionId ??
        //       question.conditions.find((condition) => !condition.answerId)
        //         .nextSectionId;
        //   }
        // } else if (!answer.answerId && answer.other) {
        //   // FREEFIELD question
        //   if (question.regex) {
        //     const regex = new RegExp(question.regex);
        //     if (!regex.test(answer.other))
        //       throw new BadRequestException(
        //         `The answer "${answer.other}" for the question #${question.id} doesn't match the regular expression`
        //       );
        //   }
        // } else {
        //   throw new BadRequestException(
        //     `Please provide either a predefined answer or a user provided answer but not both`
        //   );
        // }

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
