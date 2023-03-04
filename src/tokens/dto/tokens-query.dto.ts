import { Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, Min } from "class-validator";

export enum TokenStateFilter {
  ALL = "ALL",
  PENDING = "PENDING",
  SUBMITTED = "SUBMITTED"
}

export class TokensQueryDto {
  /**
   * Page number
   */
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @IsOptional()
  page: number;

  /**
   * Number of elements in a single page
   */
  @IsNumber()
  @Type(() => Number)
  @Min(10)
  @IsOptional()
  limit: number;

  /**
   * Filter by token state
   */
  @IsEnum(TokenStateFilter)
  @IsOptional()
  state: TokenStateFilter;
}
