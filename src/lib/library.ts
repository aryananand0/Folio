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
  rating: number | null;
  notes: string | null;
};

export const MAX_NOTES_LENGTH = 2000;

export type LibraryUpdate = {
  status?: ReadingStatusValue;
  rating?: number | null;
  notes?: string | null;
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

export function parseLibraryUpdate(value: unknown): LibraryUpdate {
  if (!isRecord(value)) throw new Error("Book update is invalid.");
  const allowed = new Set(["status", "rating", "notes"]);
  if (Object.keys(value).some((key) => !allowed.has(key))) throw new Error("Book update contains an unexpected field.");

  const update: LibraryUpdate = {};
  if ("status" in value) update.status = parseReadingStatus(value.status);
  if ("rating" in value) {
    if (value.rating === null) update.rating = null;
    else if (Number.isInteger(value.rating) && Number(value.rating) >= 1 && Number(value.rating) <= 5) {
      update.rating = Number(value.rating);
    } else throw new Error("Rating must be a whole number from 1 to 5, or empty.");
  }
  if ("notes" in value) {
    if (value.notes === null) update.notes = null;
    else if (typeof value.notes === "string") {
      const notes = value.notes.replace(/\r\n?/g, "\n").trim();
      if (notes.length > MAX_NOTES_LENGTH) throw new Error(`Notes must be ${MAX_NOTES_LENGTH} characters or fewer.`);
      update.notes = notes || null;
    } else throw new Error("Notes must be text.");
  }
  if (Object.keys(update).length === 0) throw new Error("Choose a change to save.");
  return update;
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
