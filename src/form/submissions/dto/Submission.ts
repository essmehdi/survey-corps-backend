import { IsNumber, IsOptional } from "class-validator";

export class Submission {
  @IsNumber()
  sectionId: number;

  @IsNumber()
  questionId: number;

  @IsNumber()
  @IsOptional()
  answerId?: number;

  @IsNumber()
  @IsOptional()
  other?: string;
}