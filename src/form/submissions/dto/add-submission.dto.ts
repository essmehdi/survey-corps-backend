import { Type } from "class-transformer";
import { IsNotEmpty, IsString, ValidateNested } from "class-validator";
import { SubmissionDto } from "./submission.dto";

export class AddSubmissionDto {
  /**
   * Form answers submissions
   */
  @ValidateNested()
  @Type(() => SubmissionDto)
  submissions: SubmissionDto[];

  /**
   * Form session token
   */
  @IsString()
  @IsNotEmpty()
  token: string;
}
