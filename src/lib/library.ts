import type { Book } from "./books";

export const READING_STATUSES = ["WANT_TO_READ", "READING", "FINISHED"] as const;
export type ReadingStatusValue = (typeof READING_STATUSES)[number];
export type LibraryFilter = "ALL" | ReadingStatusValue;

export const STATUS_LABELS: Record<ReadingStatusValue, string> = {
  WANT_TO_READ: "Want to Read",
  READING: "Reading",
  FINISHED: "Finished",
};

export type LibraryBook = Book & {
  id: string;
  status: ReadingStatusValue;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredText(value: unknown, label: string) {
  if (typeof value !== "string") throw new Error(`${label} is required.`);
  const text = value.trim().replace(/\s+/g, " ");
  if (!text) throw new Error(`${label} is required.`);
  if (text.length > 500) throw new Error(`${label} is too long.`);
  return text;
}

function optionalPositiveInteger(value: unknown, label: string, maximum: number) {
  if (value === null || value === undefined) return null;
  if (!Number.isSafeInteger(value) || Number(value) <= 0 || Number(value) > maximum) {
    throw new Error(`${label} is invalid.`);
  }
  return Number(value);
}

export function parseBookToSave(value: unknown): Book {
  if (!isRecord(value)) throw new Error("Book details are invalid.");
  const openLibraryKey = typeof value.openLibraryKey === "string" ? value.openLibraryKey.trim() : "";
  if (!/^\/works\/OL\d+W$/.test(openLibraryKey)) throw new Error("Open Library work is invalid.");

  return {
    openLibraryKey,
    title: requiredText(value.title, "Title"),
    author: requiredText(value.author, "Author"),
    coverId: optionalPositiveInteger(value.coverId, "Cover", 2_147_483_647),
    firstPublishYear: optionalPositiveInteger(value.firstPublishYear, "Publication year", 9999),
  };
}

export function parseReadingStatus(value: unknown): ReadingStatusValue {
  if (typeof value === "string" && READING_STATUSES.includes(value as ReadingStatusValue)) {
    return value as ReadingStatusValue;
  }
  throw new Error("Reading status is invalid.");
}

export function parseLibraryFilter(value: string | string[] | undefined): LibraryFilter {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate && READING_STATUSES.includes(candidate as ReadingStatusValue)
    ? candidate as ReadingStatusValue
    : "ALL";
}

export function parseBookId(value: unknown) {
  if (typeof value !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error("Book ID is invalid.");
  }
  return value;
}
