import { QuestionType } from "@prisma/client";
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf
} from "class-validator";

export class AddQuestionDto {
  /**
   * Question's title
   */
  @IsString()
  @IsNotEmpty()
  title: string;

  /**
   * Question's descriptionhttp://localhost:3000
   */
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  description?: string;

  /**
   * Question's type
   */
  @IsEnum(QuestionType)
  type: QuestionType;

  /**
   * Specifies if question is required or not
   */
  @IsBoolean()
  required: boolean;

  /**
   * Specifies if choice question accepts an other custom answer
   */
  @ValidateIf((o) => o.type !== "FREEFIELD")
  @IsBoolean()
  hasOther: boolean;

  /**
   * Regular expression to validate custom answer
   */
  @IsString()
  @IsOptional()
  regex?: string;

  /**
   * Previous question ID
   */
  @IsNumber()
  @ValidateIf((_, v) => v !== null)
  previous: number | null;

  // @ValidateIf(o => o.type !== 'FREEFIELD')
  // @IsArray()
  // @ValidateNested({ each: true })
  // @ArrayNotEmpty()
  // answers: AddAnswerDto[];
}
