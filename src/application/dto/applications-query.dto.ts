import { ApplicationStatus } from "@prisma/client";
import { IsEnum, IsNotEmpty, IsString } from "class-validator";
import { PaginationQueryDto } from "src/utils/dto/pagination-query.dto";

export enum StatusOptions {
  RESPONDED = "RESPONDED",
  GRANTED = "GRANTED",
  REJECTED = "REJECTED",
  PENDING = "PENDING",
  ALL = "ALL"
}

export class ApplicationsQueryDto extends PaginationQueryDto {
  /**
   * Filter applications by status
   */
  @IsNotEmpty()
  @IsEnum(StatusOptions)
  status: StatusOptions;
}
