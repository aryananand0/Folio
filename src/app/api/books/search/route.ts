import { validateQuery } from "../../../../lib/books.ts";
import { BookSearchError, searchBooks } from "../../../../lib/open-library.ts";

export const runtime = "nodejs";

// A conservative per-instance guard for this low-traffic student application.
// This is not a distributed rate limiter; see README before scaling deployment.
let nextRequestAt = 0;

export async function GET(request: Request) {
  let query: string;
  try {
    query = validateQuery(new URL(request.url).searchParams.get("q"));
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }

  if (Date.now() < nextRequestAt) {
    return Response.json({ error: "Please wait a second before searching again." }, {
      status: 429, headers: { "Retry-After": "1" },
    });
  }
  nextRequestAt = Date.now() + 1100;

  try {
    return Response.json({ books: await searchBooks(query) });
  } catch (error) {
    const status = error instanceof BookSearchError ? error.status : 502;
    return Response.json({
      error: error instanceof BookSearchError ? error.message : "Book search is unavailable. Please try again.",
    }, { status, headers: status === 429 ? { "Retry-After": "5" } : undefined });
  }
}
