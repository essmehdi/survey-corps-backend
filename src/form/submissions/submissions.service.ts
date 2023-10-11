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
import { randomUUID } from "crypto";
import { PrismaError } from "prisma-error-enum";
import { PrismaService } from "src/prisma/prisma.service";
import { AddSubmissionDto } from "./dto/add-submission.dto";
import { SubmissionDto } from "./dto/submission.dto";
import { NonExistantElementException } from "../common/exceptions/non-existant-element.exception";
import { MisplacedElementException } from "../common/exceptions/misplaced-element.exception";
import { RequiredElementException } from "../common/exceptions/required-element.exception";
import { ExclusiveChoiceException } from "../common/exceptions/exclusive-choice.exception";
import { WrongDataException } from "../common/exceptions/wrong-data.exception";
import { ResourceNotFoundException } from "src/common/exceptions/resource-not-found.exception";
import { AlreadySubmittedException } from "../common/exceptions/already-submitted-token.exception";

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
    submissionId: string,
    answer: SubmissionDto
  ) {
    const { questionId, answerId } = answer;
    await tx.submission.create({
      data: {
        question: { connect: { id: questionId } },
        answer: { connect: { id: answerId as number } },
        submissionId
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
    submissionId: string,
    answer: SubmissionDto
  ) {
    const { questionId, answerId } = answer;
    await tx.submission.createMany({
      data: (answerId as number[]).map((it) => ({
        questionId,
        answerId: it,
        submissionId
      }))
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
    submissionId: string,
    answer: SubmissionDto
  ) {
    const { questionId, other } = answer;
    await tx.submission.create({
      data: {
        question: { connect: { id: questionId } },
        other,
        submissionId
      }
    });
  }

  /**
   * A helper function to validate the 'other' against a regex if defined in the question
   * @param question The question to validate for
   * @param otherAnswer The 'other' answer to validate
   *
   * @throws {WrongDataException} If the data provided is not valid
   */
  private validateOtherAnswer(
    question: Partial<Question>,
    otherAnswer: string
  ) {
    if (question.regex) {
      if (!new RegExp(question.regex).test(otherAnswer))
        throw new WrongDataException(
          `Answer for question #${question.id} does not match the regular expression`
        );
    }
  }

  /**
   * Validates the user submission and save them to database
   * @param answers Answers provided by the client
   * @param submissionId The submission token
   *
   * @throws {NonExistantElementException} If an element does not exist
   * @throws {MisplacedElementException} If an element is misplaced
   * @throws {RequiredElementException} If a required element is missing
   * @throws {ExclusiveChoiceException} If an exclusive choice is not respected (ex: both answerId and other are provided in a single choice question)
   * @throws {WrongDataException} If the data provided is not valid
   */
  private async validateAndSaveSubmission(
    answers: SubmissionDto[],
    token: string
  ) {
    const submissionId = randomUUID();
    // Begin transaction
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
          const section = await tx.questionSection.findUnique({
            where: { id: answer.sectionId },
            include: {
              previousSections: true,
              nextSection: true,
              conditioned: true
            }
          });

          // Check if section exists
          if (!section)
            throw new ResourceNotFoundException(`Section #${answer.sectionId}`);

          // Check if the section is the first element of the submission matches with the database
          if (
            !currentSection &&
            (section.previousSections.length > 0 ||
              section.conditioned.length > 0)
          )
            throw new MisplacedElementException(
              `Section #${answer.sectionId} is not the first`
            );

          currentSection = section;
          if (section.nextSection) nextSectionId = section.nextSection.id;
          else nextSectionId = null;
        }

        // Get the current question
        const question = await tx.question.findFirst({
          where: { id: answer.questionId, sectionId: answer.sectionId },
          include: { nextQuestion: true, conditions: true }
        });
        if (!question)
          throw new ResourceNotFoundException(
            `Question #${answer.questionId} on section #${answer.sectionId}`
          );
        if (nextQuestionId && nextQuestionId !== question.id)
          throw new MisplacedElementException(
            `Bad question #${question.id} positioning`
          );

        // Check if question is required
        if (!answer.answerId && !answer.other) {
          if (question.required)
            throw new RequiredElementException(
              `Question #${question.id} is required`
            );
        } else {
          // Validate answers
          if (question.type !== QuestionType.FREEFIELD) {
            const answers = (
              await tx.answer.findMany({
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
                throw new ExclusiveChoiceException(question.id);
              if (answer.answerId) {
                if (typeof answer.answerId !== "number")
                  throw new WrongDataException(
                    `'answerId' must be a number in question #${question.id}`
                  );
                if (!answers.includes(answer.answerId)) {
                  throw new ResourceNotFoundException(
                    `Answer #${answer.answerId} on question #${answer.questionId}`
                  );
                }
                await this.addSingleAnswerSubmission(tx, submissionId, answer);
              } else {
                this.validateOtherAnswer(question, answer.other);
                await this.addOtherAnswerSubmission(tx, submissionId, answer);
              }
            } else {
              if (!Array.isArray(answer.answerId))
                throw new WrongDataException(
                  `Question #${question.id} is a multiple choice question. Answer must be an array`
                );
              if (
                answer.answerId.length === 0 ||
                !answer.answerId.every((it) => answers.includes(it))
              )
                throw new ResourceNotFoundException(
                  `Answer provided on question #${answer.questionId}`
                );
              await this.addMultipleAnswersSubmission(tx, submissionId, answer);
              if (answer.other) {
                this.validateOtherAnswer(question, answer.other);
                await this.addOtherAnswerSubmission(tx, submissionId, answer);
              }
            }
          } else {
            this.validateOtherAnswer(question, answer.other);
            await this.addOtherAnswerSubmission(tx, submissionId, answer);
          }
        }

        if (question.nextQuestion) {
          nextQuestionId = question.nextQuestion.id;
        } else {
          nextQuestionId = null;
        }
      }

      // Mark token as submitted
      await tx.token.update({
        where: { token },
        data: {
          submitted: true
        }
      });
    });
  }

  /**
   * Adds a form submission to the database
   * @param addSubmissionDto The submission data
   *
   * @throws {ResourceNotFoundException} If the token is not found
   * @throws {AlreadySubmittedException} If the token has already been used to submit
   */
  async addSubmission(addSubmissionDto: AddSubmissionDto) {
    // Check if token exists
    var token = await this.prisma.token.findUnique({
      where: { token: addSubmissionDto.token }
    });
    if (!token) {
      throw new ResourceNotFoundException("Token");
    }
    // Check if the token has already been used to submit
    if (token.submitted) {
      throw new AlreadySubmittedException();
    }

    // Validate and save submission
    await this.validateAndSaveSubmission(
      addSubmissionDto.submissions,
      addSubmissionDto.token
    );
  }
}
