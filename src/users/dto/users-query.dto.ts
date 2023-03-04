import { Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, IsString, Min } from "class-validator";

export enum PrivilegeFilter {
  ALL = "ALL",
  ADMIN = "ADMIN",
  MEMBER = "MEMBER"
}

export class UsersQueryDto {
  /**
   * Page number
   */
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @IsOptional()
  page?: number;

  /**
   * Number of elements in a single page
   */
  @IsNumber()
  @Type(() => Number)
  @Min(10)
  @IsOptional()
  limit?: number;

  /**
   * Filter by user privilege
   */
  @IsEnum(PrivilegeFilter)
  @IsOptional()
  privilege?: PrivilegeFilter;

  /**
   * Search term
   */
  @IsString()
  @IsOptional()
  search?: string;
}
