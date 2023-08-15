import { Type } from "class-transformer";
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min
} from "class-validator";
import { PaginationQueryDto } from "src/misc/dto/pagination-query.dto";

export enum PrivilegeFilter {
  ALL = "ALL",
  ADMIN = "ADMIN",
  MEMBER = "MEMBER"
}

export class UsersQueryDto extends PaginationQueryDto {
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
  @MaxLength(300)
  search?: string;
}
