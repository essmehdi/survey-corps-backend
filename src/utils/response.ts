export interface PaginatedResponse<T> {
  results: T[];
  currentPage: number;
  lastPage: number;
  total: number;
}

export const paginatedResponse = <T>(
  list: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResponse<T> => {
  return {
    results: list,
    currentPage: page,
    lastPage: Math.ceil(total / limit),
    total
  };
};
