import { BaseException } from "src/common/exceptions/base.exception";

export class ExclusiveChoiceException extends BaseException {
  constructor(questionId: number) {
    super(
      `One of 'answerId' and 'other' is required and not both in question #${questionId}`,
      400
    );
  }
}
