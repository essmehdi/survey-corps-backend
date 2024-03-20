import { applyDecorators } from "@nestjs/common";
import { ApiOkResponse, ApiProperty, getSchemaPath } from "@nestjs/swagger";

export class PaginatedResponseDto<T> {
  @ApiProperty({
    isArray: true
  })
  results: T[];
  currentPage: number;
  lastPage: number;
  total: number;

  constructor(
    results: T[],
    currentPage: number,
    lastPage: number,
    total: number
  ) {
    this.results = results;
    this.currentPage = currentPage;
    this.lastPage = lastPage;
    this.total = total;
  }

  static from<S>(list: S[], page: number, limit: number, count: number) {
    return new PaginatedResponseDto(
      list,
      page,
      Math.ceil(count / limit),
      count
    );
  }
}

export const ApiOkPaginatedResponse = (model: any) => {
  return applyDecorators(
    ApiOkResponse({
      schema: {
        properties: {
          total: {
            type: "number"
          },
          currentPage: {
            type: "number"
          },
          lastPage: {
            type: "number"
          },
          results: {
            type: "array",
            items: { $ref: getSchemaPath(model) }
          }
        }
      }
    })
  );
};
