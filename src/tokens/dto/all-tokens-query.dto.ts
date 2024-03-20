import { IsNumber, IsOptional, IsPositive, IsString, Max, MaxLength } from "class-validator";
import { TokensQueryDto } from "./tokens-query.dto";

export class AllTokensQueryDto extends TokensQueryDto {
  @IsString()
  @IsOptional()
  @MaxLength(300)
  search: string;
}
