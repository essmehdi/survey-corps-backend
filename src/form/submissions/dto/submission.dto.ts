import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Validate
} from "class-validator";

export class SubmissionDto {
  /**
   * Question's section ID
   */
  @IsNumber()
  sectionId: number;

  /**
   * Question ID
   */
  @IsNumber()
  questionId: number;

  /**
   * Must be a number for a single choice question,
   * an array of numbers for a multiple choice question,
   * or omit it for skiping a unrequired question
   */
  @Validate(isNumberOrArrayOfNumbers, {
    message: "Field must be a number or an array of numbers"
  })
  answerId?: number | number[];

  /**
   * Can be omitted for an unrequired question
   * Must be present for a required freefield question
   */
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  other?: string;
}

function isNumberOrArrayOfNumbers(value: any) {
  if (Array.isArray(value)) {
    return value.every((it) => typeof it === "number");
  }
  return typeof value === "number";
}
