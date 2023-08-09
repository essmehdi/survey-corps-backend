import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor
} from "@nestjs/common";
import { ClassConstructor, plainToInstance } from "class-transformer";
import { map } from "rxjs";
import { PaginatedResponse, paginatedResponse } from "../response";

@Injectable()
export class TransformDataInterceptor<T> implements NestInterceptor {
  constructor(private readonly classToUse: ClassConstructor<T>) {}

  intercept(_: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      map((data) => {
        if (data.results && Array.isArray(data.results)) {
          const { results, currentPage, lastPage, total } =
            data as PaginatedResponse<any>;
          return paginatedResponse(
            plainToInstance(this.classToUse, results),
            currentPage,
            lastPage,
            total
          );
        }
        return plainToInstance(this.classToUse, data);
      })
    );
  }
}
