import { HttpStatus } from "@nestjs/common";
import { BaseException } from "src/common/exceptions/base.exception";

export class EmptyElementException extends BaseException {
  constructor(message: string) {
    super(message, HttpStatus.BAD_REQUEST);
  }
}
