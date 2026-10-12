import { DEFAULT_DISCOVERY_QUERY, SEARCH_LIMIT, validateQuery, type Book, type BookSearchResult } from "./books.ts";

export class BookSearchError extends Error {
  status: number;

  constructor(message: string, status = 502) {
    super(message);
    this.name = "BookSearchError";
    this.status = status;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown, limit: number): string | null {
  return typeof value === "string" ? value.trim().slice(0, limit) || null : null;
}

/** Treat third-party JSON as untrusted; skip unusable works and tolerate absent metadata. */
export function normalizeBooks(payload: unknown): Book[] {
  if (!isRecord(payload) || !Array.isArray(payload.docs)) {
    throw new BookSearchError("Book search returned an unexpected response. Please try again.");
  }
  const books: Book[] = [];
  const seen = new Set<string>();
  for (const doc of payload.docs) {
    if (!isRecord(doc)) continue;
    const rawKey = text(doc.key, 100);
    const match = rawKey?.match(/^(?:\/works\/)?(OL\d+W)$/);
    const title = text(doc.title, 500);
    if (!match || !title) continue;
    const key = `/works/${match[1]}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const authors = Array.isArray(doc.author_name)
      ? doc.author_name.map((author) => text(author, 200)).filter(Boolean).slice(0, 5)
      : [];
    books.push({
      openLibraryKey: key,
      title,
      author: authors.length ? authors.join(", ") : "Unknown author",
      coverId: Number.isSafeInteger(doc.cover_i) && Number(doc.cover_i) > 0 ? Number(doc.cover_i) : null,
      firstPublishYear: Number.isSafeInteger(doc.first_publish_year)
        && Number(doc.first_publish_year) >= -5000 && Number(doc.first_publish_year) <= 9999
        ? Number(doc.first_publish_year) : null,
    });
    if (books.length === SEARCH_LIMIT) break;
  }
  if (payload.docs.length && !books.length) {
    throw new BookSearchError("We couldn’t read those book results. Please try a different search.");
  }
  return books;
}

export function normalizeSearchResult(payload: unknown): BookSearchResult {
  const books = normalizeBooks(payload);
  if (!isRecord(payload)) throw new BookSearchError("Book search returned an unexpected response. Please try again.");
  const rawTotal = payload.numFound ?? payload.num_found;
  const total = Number.isSafeInteger(rawTotal) && Number(rawTotal) >= 0 ? Number(rawTotal) : books.length;
  return { books, total: Math.max(total, books.length), totalExact: payload.numFoundExact !== false };
}

/** Only the route handler imports this module; never accepts a user-provided URL. */
export async function searchBooks(query: string, fetcher: typeof fetch = fetch): Promise<BookSearchResult> {
  const url = new URL("https://openlibrary.org/search.json");
  url.search = new URLSearchParams({
    q: validateQuery(query || DEFAULT_DISCOVERY_QUERY),
    fields: "key,title,author_name,first_publish_year,cover_i",
    limit: String(SEARCH_LIMIT),
  }).toString();

  try {
    const contact = process.env.OPEN_LIBRARY_CONTACT_EMAIL?.trim();
    const response = await fetcher(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": contact ? `Folio/0.2 (${contact})` : "Folio/0.2 (educational book discovery)",
      },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(10_000),
      redirect: "error",
    });
    if (response.status === 429) {
      throw new BookSearchError("Book search is busy. Please wait a moment and try again.", 429);
    }
    if (!response.ok) throw new BookSearchError("Book search is temporarily unavailable. Please try again shortly.");
    return normalizeSearchResult(await response.json());
  } catch (error) {
    if (error instanceof BookSearchError) throw error;
    if (error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name)) {
      throw new BookSearchError("Book search took too long. Please try again.", 504);
    }
    throw new BookSearchError("We couldn’t reach book search. Please try again shortly.");
  }
}
