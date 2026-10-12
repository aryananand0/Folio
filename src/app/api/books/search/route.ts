import { normalizeOptionalQuery } from "../../../../lib/books.ts";
import { BookSearchError, searchBooks } from "../../../../lib/open-library.ts";

export const runtime = "nodejs";

export async function GET(request: Request) {
  let query: string;
  try {
    query = normalizeOptionalQuery(new URL(request.url).searchParams.get("q"));
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }

  try {
    return Response.json(await searchBooks(query));
  } catch (error) {
    const status = error instanceof BookSearchError ? error.status : 502;
    return Response.json({
      error: error instanceof BookSearchError ? error.message : "Book search is unavailable. Please try again.",
    }, { status, headers: status === 429 ? { "Retry-After": "5" } : undefined });
  }
}
