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
   * User's fullname
   */
  @IsString()
  @IsNotEmpty()
  fullname: string;

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
