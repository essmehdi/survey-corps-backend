import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Validate
} from "class-validator";

export class Submission {
  @IsNumber()
  sectionId: number;

  @IsNumber()
  questionId: number;

  @Validate(isNumberOrArrayOfNumbers, {
    message: "Field must be a number or an array of numbers"
  })
  answerId?: number | number[];

  @IsString()
  @IsOptional()
  other?: string;
}

function isNumberOrArrayOfNumbers(value: any) {
  if (Array.isArray(value)) {
    return value.every((it) => typeof it === "number");
  }
  return typeof value === "number";
}
