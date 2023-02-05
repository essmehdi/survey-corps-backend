import { Type } from "class-transformer";
import {
  IsEnum,
  IsNumber,
  IsObject,
  IsPositive,
  registerDecorator,
  ValidateIf,
  ValidationArguments,
  ValidationOptions,
  Validator
} from "class-validator";

export enum NextSectionType {
  SECTION = "section",
  CONDITION = "condition"
}

function IsNumberToNumberObject(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: "isNumberToNumberObject",
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any) {
          return (
            Object.keys(value).every(Number.isNaN) &&
            Object.values(value).every(Number.isNaN)
          );
        }
      }
    });
  };
}

export class ConditionDto {
  @IsNumber()
  @IsPositive()
  question: number;

  @IsObject()
  @IsNumberToNumberObject()
  answers: Record<number, number>;
}

export class ChangeNextSectionDto {
  @IsEnum(NextSectionType)
  type: NextSectionType;

  @ValidateIf((self) => self.type === NextSectionType.SECTION)
  section: number;

  @ValidateIf((self) => self.type === NextSectionType.CONDITION)
  @Type(() => ConditionDto)
  condition: ConditionDto;
}
