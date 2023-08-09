import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, Min } from "class-validator";

export class PaginationQueryDto {
  /**
   * Page number
   */
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @IsOptional()
  @ApiPropertyOptional()
  page: number = 1;

  /**
   * Number of elements in a single page
   */
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @IsOptional()
  @ApiPropertyOptional()
  limit: number = 30;
}
