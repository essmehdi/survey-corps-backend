/**
 * Converts a search term for PostgreSQL full text search into a little smarter term
 * @param term The term to optimize
 */
export const convertToTsquery = (term: string) => {
  return term.trim().split(" ").join(" & ");
};
