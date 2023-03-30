import { IsNumber, IsOptional, IsPositive, IsString } from "class-validator";
import { TokensQueryDto } from "./tokens-query.dto";

export class AllTokensQueryDto extends TokensQueryDto {
  @IsString()
  @IsOptional()
  search: string;
}
