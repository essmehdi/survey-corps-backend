import { Privilege } from "@prisma/client";
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength
} from "class-validator";

export class RegisterUserDto {
  /**
   * User's firstname
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstname: string;

  /**
   * User's lastname
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastname: string;

  /**
   * User's email
   */
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(150)
  email: string;

  /**
   * User's assigned privilege
   */
  @IsEnum(Privilege)
  @IsOptional()
  privilege: Privilege;
}
