import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeOptionalQuery, validateQuery } from "../src/lib/books.ts";
import { closestBookTitles, getMatchIndices, levenshtein, resolveSearchTerm, suggestBookTitles } from "../src/lib/book-suggestions.ts";
import { BookSearchError, normalizeBooks, normalizeSearchResult, searchBooks } from "../src/lib/open-library.ts";
import { GET } from "../src/app/api/books/search/route.ts";

test("query validation rejects empty and long input and normalizes whitespace", () => {
  for (const query of [null, "", " \n\t", "a".repeat(121)]) assert.throws(() => validateQuery(query));
  assert.equal(validateQuery("  Toni   Morrison  "), "Toni Morrison");
  assert.equal(validateQuery("a".repeat(120)).length, 120);
  assert.equal(normalizeOptionalQuery("  "), "");
  assert.throws(() => normalizeOptionalQuery("a".repeat(121)));
});

test("search result normalization includes the live Open Library count", () => {
  assert.deepEqual(normalizeSearchResult({ numFound: 248, numFoundExact: true, docs: [] }), {
    books: [], total: 248, totalExact: true,
  });
  assert.deepEqual(normalizeSearchResult({ docs: [{ key: "OL1W", title: "Book" }] }), {
    books: [{ openLibraryKey: "/works/OL1W", title: "Book", author: "Unknown author", coverId: null, firstPublishYear: null }],
    total: 1,
    totalExact: true,
  });
});

test("title suggestions rank partial matches, tolerate typos, and expose highlight positions", () => {
  assert.ok(suggestBookTitles("hob")[0].includes("Hobbit"));
  assert.ok(suggestBookTitles("godfater").includes("The Godfather"));
  assert.equal(resolveSearchTerm("godfater"), "The Godfather");
  assert.ok(levenshtein("godfater", "godfather") <= 2);
  assert.ok(getMatchIndices("The Godfather", "godfater").size > 0);
  assert.ok(suggestBookTitles("the").length <= 6);
  assert.equal(closestBookTitles("zzzzzz").length, 6);
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
    return Response.json({ numFound: 0, numFoundExact: true, docs: [] });
  };
  assert.deepEqual(await searchBooks("https://127.0.0.1/?x=1&limit=999", fetcher), { books: [], total: 0, totalExact: true });
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

test("HTTP boundary supports discovery, normalizes results, and maps failures", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async () => Response.json({ numFound: 31, docs: [{ key: "OL1W", title: "The Hobbit" }] }));
  const discovery = await GET(new Request("http://localhost/api/books/search"));
  assert.equal(discovery.status, 200);
  assert.equal((await discovery.json()).total, 31);
  const success = await GET(new Request("http://localhost/api/books/search?q=Hobbit"));
  assert.equal(success.status, 200);
  assert.equal((await success.json()).books[0].title, "The Hobbit");
  fetchMock.mock.mockImplementation(async () => { throw new DOMException("timeout", "TimeoutError"); });
  const timeout = await GET(new Request("http://localhost/api/books/search?q=Hobbit"));
  assert.equal(timeout.status, 504);
  assert.match((await timeout.json()).error, /too long/);
});
