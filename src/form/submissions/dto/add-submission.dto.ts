import { Type } from "class-transformer";
import {
  ArrayNotEmpty,
  IsNotEmpty,
  IsString,
  IsUUID,
  ValidateNested
} from "class-validator";
import { SubmissionDto } from "./submission.dto";

export class AddSubmissionDto {
  /**
   * Form answers submissions
   */
  @ValidateNested()
  @ArrayNotEmpty()
  @Type(() => SubmissionDto)
  submissions: SubmissionDto[];

  /**
   * Form session token
   */
  @IsString()
  @IsNotEmpty()
  @IsUUID(4)
  token: string;
}
