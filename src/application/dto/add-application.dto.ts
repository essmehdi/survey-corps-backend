import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class CreateApplicationDto {
  /**
   * Applicant's fullname
   */
  @IsString()
  @IsNotEmpty()
  fullname: string;

  /**
   * Applicant's email
   */
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
