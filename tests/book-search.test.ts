import assert from "node:assert/strict";
import { test } from "node:test";
import { validateQuery } from "../src/lib/books.ts";
import { BookSearchError, normalizeBooks, searchBooks } from "../src/lib/open-library.ts";
import { GET } from "../src/app/api/books/search/route.ts";

test("query validation rejects empty and long input and normalizes whitespace", () => {
  for (const query of [null, "", " \n\t", "a".repeat(121)]) assert.throws(() => validateQuery(query));
  assert.equal(validateQuery("  Toni   Morrison  "), "Toni Morrison");
  assert.equal(validateQuery("a".repeat(120)).length, 120);
});

test("normalization tolerates missing fields, canonicalizes work IDs, and removes duplicates", () => {
  assert.deepEqual(normalizeBooks({ docs: [
    null, {}, { key: "/books/OL1M", title: "Edition" },
    { key: "OL1W", title: " Test ", author_name: [null, " Author ", 42], cover_i: -2, first_publish_year: "1999" },
    { key: "/works/OL1W", title: "Duplicate" },
    { key: "/works/OL2W", title: "Other", cover_i: 123, first_publish_year: 1937 },
  ] }), [
    { openLibraryKey: "/works/OL1W", title: "Test", author: "Author", coverId: null, firstPublishYear: null },
    { openLibraryKey: "/works/OL2W", title: "Other", author: "Unknown author", coverId: 123, firstPublishYear: 1937 },
  ]);
});

test("empty results differ from unusable or malformed responses; results stay bounded", () => {
  assert.deepEqual(normalizeBooks({ docs: [] }), []);
  for (const payload of [null, {}, { docs: "bad" }, { docs: [{}] }]) assert.throws(() => normalizeBooks(payload), BookSearchError);
  assert.equal(normalizeBooks({ docs: Array.from({ length: 30 }, (_, i) => ({ key: `OL${i}W`, title: "Book" })) }).length, 12);
});

test("search uses fixed host, limited fields, cache, timeout, and encoded user input", async () => {
  const fetcher: typeof fetch = async (input, init) => {
    const url = new URL(String(input));
    assert.equal(url.origin + url.pathname, "https://openlibrary.org/search.json");
    assert.equal(url.searchParams.get("q"), "https://127.0.0.1/?x=1&limit=999");
    assert.equal(url.searchParams.get("limit"), "12");
    assert.equal(url.searchParams.get("fields"), "key,title,author_name,first_publish_year,cover_i");
    assert.equal(init?.next?.revalidate, 3600);
    assert.ok(init?.signal);
    assert.equal(init?.redirect, "error");
    return Response.json({ docs: [] });
  };
  assert.deepEqual(await searchBooks("https://127.0.0.1/?x=1&limit=999", fetcher), []);
});

test("upstream failures, malformed JSON, and timeouts become safe errors", async () => {
  const cases: [typeof fetch, number][] = [
    [async () => new Response(null, { status: 429 }), 429],
    [async () => new Response("private upstream details", { status: 500 }), 502],
    [async () => new Response("not json"), 502],
    [async () => { throw new Error("sensitive network details"); }, 502],
    [async () => { throw new DOMException("timed out", "TimeoutError"); }, 504],
  ];
  for (const [fetcher, status] of cases) {
    await assert.rejects(searchBooks("Hobbit", fetcher), (error: unknown) => {
      assert.ok(error instanceof BookSearchError);
      assert.equal(error.status, status);
      assert.doesNotMatch(error.message, /private|sensitive|not json/);
      return true;
    });
  }
});

test("HTTP boundary rejects invalid queries, normalizes results, throttles, and maps failures", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async () => Response.json({ docs: [{ key: "OL1W", title: "The Hobbit" }] }));
  const time = t.mock.method(Date, "now", () => 10_000);
  assert.equal((await GET(new Request("http://localhost/api/books/search?q=%20"))).status, 400);
  assert.equal(fetchMock.mock.callCount(), 0);
  const success = await GET(new Request("http://localhost/api/books/search?q=Hobbit"));
  assert.equal(success.status, 200);
  assert.equal((await success.json()).books[0].title, "The Hobbit");
  const limited = await GET(new Request("http://localhost/api/books/search?q=Hobbit"));
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get("Retry-After"), "1");
  assert.equal(fetchMock.mock.callCount(), 1);
  time.mock.mockImplementation(() => 12_000);
  fetchMock.mock.mockImplementation(async () => { throw new DOMException("timeout", "TimeoutError"); });
  const timeout = await GET(new Request("http://localhost/api/books/search?q=Hobbit"));
  assert.equal(timeout.status, 504);
  assert.match((await timeout.json()).error, /too long/);
});
