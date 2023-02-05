import { Privilege } from "@prisma/client";
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString
} from "class-validator";

export class RegisterUserDto {
  @IsString()
  @IsNotEmpty()
  fullname: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsEnum(Privilege)
  @IsOptional()
  privilege: Privilege;
}
