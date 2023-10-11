import { HttpStatus } from "@nestjs/common";
import { BaseException } from "src/common/exceptions/base.exception";

export class WeakPasswordException extends BaseException {
  constructor() {
    super("The password is too weak", HttpStatus.BAD_REQUEST);
  }
}
