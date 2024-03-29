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

export class EditQuestionDto {
  /**
   * New question's title
   */
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(150)
  title?: string;

  /**
   * New question's description
   */
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  /**
   * New question type
   */
  @IsEnum(QuestionType)
  @IsOptional()
  type?: QuestionType;

  /**
   * Specifies if question is required or not
   */
  @IsBoolean()
  @IsOptional()
  required?: boolean;

  /**
   * Specifies if choice question accepts an other custom answer
   */
  @ValidateIf((o) => o.type !== "FREEFIELD")
  @IsBoolean()
  @IsOptional()
  hasOther?: boolean;

  /**
   * Specifies the regex of the question if it is a freefield question
   */
  @ValidateIf((o) => o.type === "FREEFIELD")
  @IsString()
  @IsOptional()
  @MaxLength(300)
  regex?: string | null;
}
