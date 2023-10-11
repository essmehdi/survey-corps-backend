import { HttpStatus } from "@nestjs/common";
import { BaseException } from "./base.exception";

export class ResourceNotFoundException extends BaseException {
  constructor(resource: string) {
    super(`${resource} was not found`, HttpStatus.NOT_FOUND);
  }
}
