export const paginatedResponse = <T>(
  list: T[],
  page: number,
  limit: number,
  total: number
) => {
  return {
    results: list,
    currentPage: page,
    lastPage: Math.ceil(total / limit),
    total
  };
};
