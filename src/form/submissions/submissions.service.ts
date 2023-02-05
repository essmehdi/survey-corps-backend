import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException
} from "@nestjs/common";
import { PrismaClient, QuestionSection } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";
import { Submission } from "./dto/Submission";

@Injectable()
export class SubmissionsService {
  constructor(private prisma: PrismaService) {}

  private async validateSubmission(answers: Submission[]) {
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

      // Validate the answer
      if (answer.answerId && !answer.other) {
        const questionAnswer = await this.prisma.answer.findFirst({
          where: { id: answer.answerId, questionId: question.id }
        });
        if (!questionAnswer)
          throw new NotFoundException(
            `Answer #${answer.answerId} on question #${answer.questionId} does not exist`
          );

        if (question.conditions.length) {
          if (nextSectionId)
            throw new UnprocessableEntityException(`Form integrity error`);
          const verifiedCondition = question.conditions.find(
            (condition) => condition.answerId === questionAnswer.id
          );
          nextSectionId =
            verifiedCondition?.nextSectionId ??
            question.conditions.find((condition) => !condition.answerId)
              .nextSectionId;
        }
      } else if (!answer.answerId && answer.other) {
        if (question.regex) {
          const regex = new RegExp(question.regex);
          if (!regex.test(answer.other))
            throw new BadRequestException(
              `The answer "${answer.other}" for the question #${question.id} doesn't match the regular expression`
            );
        }
      } else {
        throw new BadRequestException(
          `Please provide either a predefined answer or a user provided answer but not both`
        );
      }

      if (question.nextQuestion) {
        nextQuestionId = question.nextQuestion.id;
      } else {
        nextQuestionId = null;
      }
    }
    return true;
  }

  async addSubmission(answers: Submission[]) {
    return {
      valid: await this.validateSubmission(answers)
    };
  }
}
