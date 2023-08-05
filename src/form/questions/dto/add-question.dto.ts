import { QuestionType } from "@prisma/client";
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  ValidateIf
} from "class-validator";

export class AddQuestionDto {
  /**
   * Question's title
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title: string;

  /**
   * Question's descriptionhttp://localhost:3000
   */
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(500)
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
  @MaxLength(300)
  regex?: string;

  /**
   * Previous question ID
   */
  @IsNumber()
  @ValidateIf((_, v) => v !== null)
  previous: number | null;
}
