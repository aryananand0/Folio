/** The small, stable shape shared by discovery UI and future saved records. */
export type Book = {
  openLibraryKey: string;
  title: string;
  author: string;
  coverId: number | null;
  firstPublishYear: number | null;
};

export const SEARCH_LIMIT = 12;
export const MAX_QUERY_LENGTH = 120;

export function validateQuery(value: string | null): string {
  const query = value?.trim().replace(/\s+/g, " ") ?? "";
  if (!query) throw new Error("Enter a book title or author to search.");
  if (query.length > MAX_QUERY_LENGTH) {
    throw new Error(`Keep your search to ${MAX_QUERY_LENGTH} characters or fewer.`);
  }
  return query;
}
