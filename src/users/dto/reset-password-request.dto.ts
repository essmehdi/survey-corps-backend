import { IsEmail, IsNotEmpty, IsOptional } from "class-validator";

export class ResetPasswordRequestDto {
  @IsEmail()
  @IsNotEmpty()
  @IsOptional()
  email?: string;
}
