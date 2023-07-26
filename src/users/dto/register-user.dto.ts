import { Privilege } from "@prisma/client";
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString
} from "class-validator";

export class RegisterUserDto {
  /**
   * User's firstname
   */
  @IsString()
  @IsNotEmpty()
  firstname: string;

  /**
   * User's lastname
   */
  @IsString()
  @IsNotEmpty()
  lastname: string;

  /**
   * User's email
   */
  @IsEmail()
  @IsNotEmpty()
  email: string;

  /**
   * User's assigned privilege
   */
  @IsEnum(Privilege)
  @IsOptional()
  privilege: Privilege;
}
