import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString
} from "class-validator";
import { RegisterUserDto } from "./register-user.dto";
import { Privilege } from "@prisma/client";

export class UpdateUserDto {
  /**
   * User's firstname
   */
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  firstname: string;

  /**
   * User's lastname
   */
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  lastname: string;

  /**
   * User's email
   */
  @IsEmail()
  @IsNotEmpty()
  @IsOptional()
  email: string;

  /**
   * User's assigned privilege
   */
  @IsEnum(Privilege)
  @IsOptional()
  privilege: Privilege;
}
