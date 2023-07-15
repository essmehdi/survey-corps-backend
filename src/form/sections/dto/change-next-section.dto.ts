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
  /**
   * Conditional question ID
   */
  @IsNumber()
  @IsPositive()
  question: number;

  /**
   * Mapping of the answers and next section
   */
  @IsObject()
  @IsNumberToNumberObject()
  answers: Record<number, number>;
}

export class ChangeNextSectionDto {
  /**
   * Specifies if next section is direct or conditional
   */
  @IsEnum(NextSectionType)
  type: NextSectionType;

  /**
   * Should be specified if type is 'SECTION'
   */
  @ValidateIf((self) => self.type === NextSectionType.SECTION)
  section?: number | null;

  /**
   * Should be specified if type is 'CONDITION'
   */
  @ValidateIf((self) => self.type === NextSectionType.CONDITION)
  @Type(() => ConditionDto)
  condition?: ConditionDto;
}
