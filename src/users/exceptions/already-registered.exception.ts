import { HttpStatus } from "@nestjs/common";
import { BaseException } from "src/common/exceptions/base.exception";

export class AlreadyRegisteredException extends BaseException {
  constructor() {
    super("The user is already registered", HttpStatus.CONFLICT);
  }
}
