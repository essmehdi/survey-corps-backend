import { Type } from "class-transformer";
import { IsNotEmpty, IsString, ValidateNested } from "class-validator";
import { Submission } from "./Submission";

export class AddSubmissionDto {
  @ValidateNested()
  @Type(() => Submission)
  submissions: Submission[];

  @IsString()
  @IsNotEmpty()
  token: string;
}
