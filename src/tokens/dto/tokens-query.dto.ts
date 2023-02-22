import { Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, Min } from "class-validator";

export enum TokenStateFilter {
  ALL = "ALL",
  PENDING = "PENDING",
  SUBMITTED = "SUBMITTED"
}

export class TokensQueryDto {
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @IsOptional()
  page: number;

  @IsNumber()
  @Type(() => Number)
  @Min(10)
  @IsOptional()
  limit: number;

  @IsEnum(TokenStateFilter)
  @IsOptional()
  state: TokenStateFilter;
}
