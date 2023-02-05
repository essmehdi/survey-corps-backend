import { Type } from "class-transformer";
import { ValidateNested } from "class-validator";
import { Submission } from "./Submission";

export class AddSubmissionDto {
  @ValidateNested()
  @Type(() => Submission)
  submissions: Submission[];
}
