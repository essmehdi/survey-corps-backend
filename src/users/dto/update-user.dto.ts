import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength
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
  @MaxLength(100)
  firstname?: string;

  /**
   * User's lastname
   */
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(100)
  lastname?: string;

  /**
   * User's email
   */
  @IsEmail()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(150)
  email?: string;

  /**
   * User's assigned privilege
   */
  @IsEnum(Privilege)
  @IsOptional()
  privilege?: Privilege;
}
