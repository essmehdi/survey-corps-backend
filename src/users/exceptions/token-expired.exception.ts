import { HttpStatus } from "@nestjs/common";
import { BaseException } from "src/common/exceptions/base.exception";

export class TokenExpiredException extends BaseException {
  constructor() {
    super("The token has expired", HttpStatus.FORBIDDEN);
  }
}
