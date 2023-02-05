import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class Submission {
  @IsNumber()
  sectionId: number;

  @IsNumber()
  questionId: number;

  @IsNumber()
  @IsOptional()
  answerId?: number;

  @IsString()
  @IsOptional()
  other?: string;
}