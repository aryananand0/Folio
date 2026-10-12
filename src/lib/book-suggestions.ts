import type { Book } from "./books";

const TITLE_SUGGESTIONS = [
  "1984", "Beloved", "Brave New World", "Crime and Punishment", "Dune",
  "Frankenstein", "Jane Eyre", "Little Women", "Moby-Dick", "Pride and Prejudice",
  "The Alchemist", "The Bell Jar", "The Book Thief", "The Catcher in the Rye",
  "The Color Purple", "The Count of Monte Cristo", "The Great Gatsby", "The Godfather",
  "The Handmaid's Tale", "The Hobbit", "The Left Hand of Darkness", "The Little Prince",
  "The Lord of the Rings", "The Name of the Rose", "The Night Circus", "The Odyssey",
  "The Road", "The Secret History", "The Song of Achilles", "Their Eyes Were Watching God",
  "To Kill a Mockingbird", "Wuthering Heights",
];

export function normalizeSearchText(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function levenshtein(left: string, right: string) {
  const a = normalizeSearchText(left).replaceAll(" ", "");
  const b = normalizeSearchText(right).replaceAll(" ", "");
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const saved = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = saved;
    }
  }
  return row[b.length];
}

function searchableTitle(title: string) {
  return normalizeSearchText(title).replace(/^(the|a|an) /, "");
}

function rankTitle(title: string, query: string) {
  const candidate = searchableTitle(title);
  const term = normalizeSearchText(query);
  if (!term) return 100;
  if (candidate === term) return 0;
  if (candidate.startsWith(term)) return 1 + (candidate.length - term.length) / 100;
  const index = candidate.indexOf(term);
  if (index >= 0) return 2 + index / 100;
  const distance = levenshtein(candidate, term);
  return distance <= Math.max(2, Math.floor(term.length * 0.3)) ? 4 + distance : 100;
}

export function suggestBookTitles(query: string, books: Book[] = [], limit = 6) {
  const titles = [...new Set([...books.map((book) => book.title), ...TITLE_SUGGESTIONS])];
  return titles
    .map((title) => ({ title, score: rankTitle(title, query) }))
    .filter(({ score }) => score < 100)
    .sort((a, b) => a.score - b.score || a.title.localeCompare(b.title))
    .slice(0, limit)
    .map(({ title }) => title);
}

export function closestBookTitles(query: string, books: Book[] = [], limit = 6) {
  const titles = [...new Set([...books.map((book) => book.title), ...TITLE_SUGGESTIONS])];
  return titles
    .map((title) => ({ title, distance: levenshtein(searchableTitle(title), query) }))
    .sort((a, b) => a.distance - b.distance || a.title.localeCompare(b.title))
    .slice(0, limit)
    .map(({ title }) => title);
}

export function resolveSearchTerm(query: string, suggestions = suggestBookTitles(query)) {
  const term = normalizeSearchText(query).replaceAll(" ", "");
  const first = suggestions[0];
  if (!first || term.length < 5) return query;
  const candidate = searchableTitle(first).replaceAll(" ", "");
  const distance = levenshtein(candidate, term);
  return Math.abs(candidate.length - term.length) <= 2 && distance <= Math.max(2, Math.floor(term.length * 0.3))
    ? first : query;
}

export function bookMatchesQuery(book: Book, query: string) {
  const term = normalizeSearchText(query);
  if (!term) return true;
  const haystack = normalizeSearchText(`${book.title} ${book.author}`);
  if (haystack.includes(term)) return true;
  return levenshtein(book.title, term) <= Math.max(2, Math.floor(term.length * 0.3));
}

export function getMatchIndices(title: string, query: string) {
  const wanted = normalizeSearchText(query).replaceAll(" ", "");
  if (!wanted) return new Set<number>();
  const indices = new Set<number>();
  let queryIndex = 0;
  for (let index = 0; index < title.length && queryIndex < wanted.length; index += 1) {
    const character = normalizeSearchText(title[index]);
    if (character && character === wanted[queryIndex]) {
      indices.add(index);
      queryIndex += 1;
    }
  }
  return queryIndex === wanted.length ? indices : new Set<number>();
}
