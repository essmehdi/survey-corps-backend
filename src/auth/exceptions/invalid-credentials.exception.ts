import { HttpStatus } from "@nestjs/common";
import { BaseException } from "src/common/exceptions/base.exception";

export class InvalidCredentialsException extends BaseException {
  constructor() {
    super("Invalid credentials", HttpStatus.BAD_REQUEST);
  }
}
