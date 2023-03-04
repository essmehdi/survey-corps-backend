import { ApplicationStatus } from "@prisma/client";
import { IsEnum, IsNotEmpty, IsString } from "class-validator";

export enum StatusOptions {
  RESPONDED = "RESPONDED",
  PENDING = "PENDING"
}

export class ApplicationsQueryDto {
  /**
   * Filter applications by status
   */
  @IsNotEmpty()
  @IsEnum(StatusOptions)
  status: string;
}
