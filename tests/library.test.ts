import assert from "node:assert/strict";
import { test } from "node:test";
import {
  parseBookId,
  parseBookToSave,
  parseLibraryFilter,
  parseReadingStatus,
} from "../src/lib/library.ts";

test("saved-book input accepts only normalized Open Library work metadata", () => {
  assert.deepEqual(parseBookToSave({
    openLibraryKey: " /works/OL45804W ",
    title: "  The   Hobbit ",
    author: " J. R. R. Tolkien ",
    coverId: 123,
    firstPublishYear: 1937,
    clerkUserId: "browser-user-is-ignored",
  }), {
    openLibraryKey: "/works/OL45804W",
    title: "The Hobbit",
    author: "J. R. R. Tolkien",
    coverId: 123,
    firstPublishYear: 1937,
  });

  for (const invalid of [
    null,
    {},
    { openLibraryKey: "/books/OL1M", title: "Book", author: "Author" },
    { openLibraryKey: "/works/OL1W", title: "", author: "Author" },
    { openLibraryKey: "/works/OL1W", title: "Book", author: "A".repeat(501) },
    { openLibraryKey: "/works/OL1W", title: "Book", author: "Author", coverId: -1 },
    { openLibraryKey: "/works/OL1W", title: "Book", author: "Author", firstPublishYear: "1937" },
  ]) assert.throws(() => parseBookToSave(invalid));
});

test("library status, filters, and record IDs reject unexpected values", () => {
  assert.equal(parseReadingStatus("READING"), "READING");
  assert.throws(() => parseReadingStatus("PAUSED"));
  assert.equal(parseLibraryFilter("FINISHED"), "FINISHED");
  assert.equal(parseLibraryFilter(["READING", "FINISHED"]), "READING");
  assert.equal(parseLibraryFilter("invalid"), "ALL");
  assert.equal(parseLibraryFilter(undefined), "ALL");
  assert.equal(parseBookId("550e8400-e29b-41d4-a716-446655440000"), "550e8400-e29b-41d4-a716-446655440000");
  for (const value of [null, "", "../../../etc/passwd", "550e8400-e29b-01d4-a716-446655440000"]) {
    assert.throws(() => parseBookId(value));
  }
});
