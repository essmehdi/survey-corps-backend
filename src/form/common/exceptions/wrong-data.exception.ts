import { BaseException } from "src/common/exceptions/base.exception";

export class WrongDataException extends BaseException {
  constructor(message: string) {
    super(message, 400);
  }
}
