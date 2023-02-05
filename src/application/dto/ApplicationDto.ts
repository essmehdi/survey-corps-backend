import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class ApplicationDto {
  @IsString()
  @IsNotEmpty()
  fullname: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;
}
