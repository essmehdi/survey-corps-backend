import { IsEmail, IsNotEmpty, IsString, Max } from "class-validator";

export class CreateApplicationDto {
  /**
   * Applicant's fullname
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  fullname: string;

  /**
   * Applicant's email
   */
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(150)
  email: string;
}
