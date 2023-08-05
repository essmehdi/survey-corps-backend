import { IsEmail, IsNotEmpty, IsOptional, MaxLength } from "class-validator";

export class ResetPasswordRequestDto {
  @IsEmail()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(150)
  email?: string;
}
