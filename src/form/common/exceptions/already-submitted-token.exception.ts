import { HttpStatus } from "@nestjs/common";
import { BaseException } from "src/common/exceptions/base.exception";

export class AlreadySubmittedException extends BaseException {
  constructor() {
    super("Token is already submitted", HttpStatus.UNAUTHORIZED);
  }
}
