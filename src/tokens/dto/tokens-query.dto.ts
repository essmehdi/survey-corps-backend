import { Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, Min } from "class-validator";
import { PaginationQueryDto } from "src/common/dto/pagination-query.dto";

export enum TokenStateFilter {
  ALL = "ALL",
  PENDING = "PENDING",
  SUBMITTED = "SUBMITTED"
}

export class TokensQueryDto extends PaginationQueryDto {
  /**
   * Filter by token state
   */
  @IsEnum(TokenStateFilter)
  @IsOptional()
  state: TokenStateFilter;
}
