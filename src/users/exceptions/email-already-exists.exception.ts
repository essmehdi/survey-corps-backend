import { HttpStatus } from "@nestjs/common";
import { BaseException } from "src/common/exceptions/base.exception";

export class EmailAlreadyExistsException extends BaseException {
  constructor() {
    super("The email exists", HttpStatus.CONFLICT);
  }
}
