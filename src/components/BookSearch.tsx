"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { bookMatchesQuery, closestBookTitles, getMatchIndices, resolveSearchTerm, suggestBookTitles } from "@/lib/book-suggestions";
import { MAX_QUERY_LENGTH, SEARCH_LIMIT, type Book, type BookSearchResult } from "@/lib/books";
import BookCard from "./BookCard";
import BookDetails from "./BookDetails";

type SearchData = BookSearchResult & { query: string };

function HighlightedTitle({ title, query }: { title: string; query: string }) {
  const matches = getMatchIndices(title, query);
  return title.split("").map((character, index) => matches.has(index)
    ? <mark key={`${character}-${index}`}>{character}</mark>
    : <Fragment key={`${character}-${index}`}>{character}</Fragment>);
}

export default function BookSearch() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState<SearchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [selected, setSelected] = useState<Book | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const defaultData = useRef<SearchData | null>(null);
  const requestSequence = useRef(0);

  const suggestions = useMemo(() => suggestBookTitles(query, data?.books), [query, data?.books]);
  const closestTitles = useMemo(() => closestBookTitles(query, data?.books), [query, data?.books]);
  const trimmedQuery = query.trim();
  const isSettled = data?.query === trimmedQuery;
  const locallyFiltered = useMemo(
    () => trimmedQuery && !isSettled && data ? data.books.filter((book) => bookMatchesQuery(book, trimmedQuery)) : data?.books ?? [],
    [data, isSettled, trimmedQuery],
  );
  const visibleBooks = !isSettled && locallyFiltered.length === 0 ? data?.books ?? [] : locallyFiltered;
  const visibleCount = isSettled ? data?.total ?? 0 : locallyFiltered.length;
  const showSuggestions = focused && trimmedQuery.length > 0 && suggestions.length > 0;

  useEffect(() => {
    const normalized = query.trim().replace(/\s+/g, " ");
    const sequence = ++requestSequence.current;
    const controller = new AbortController();

    if (!normalized && defaultData.current) {
      setData(defaultData.current);
      setLoading(false);
      setError("");
      return () => controller.abort();
    }

    setLoading(true);
    setError("");
    const timer = window.setTimeout(async () => {
      const target = resolveSearchTerm(normalized);
      try {
        const params = target ? `?${new URLSearchParams({ q: target })}` : "";
        const response = await fetch(`/api/books/search${params}`, {
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15_000)]),
        });
        const result: unknown = await response.json();
        if (!response.ok) {
          throw new Error(typeof result === "object" && result && "error" in result && typeof result.error === "string"
            ? result.error : "Search is unavailable. Please try again.");
        }
        if (!isSearchResult(result) || sequence !== requestSequence.current) return;
        const next = { ...result, query: normalized };
        setData(next);
        if (!normalized) defaultData.current = next;
        setSelected(null);
      } catch (searchError) {
        if (controller.signal.aborted || sequence !== requestSequence.current) return;
        setError(searchError instanceof Error && searchError.name === "TimeoutError"
          ? "Search took too long. Please try again."
          : searchError instanceof Error ? searchError.message : "Couldn’t connect to search. Check your connection and try again.");
      } finally {
        if (sequence === requestSequence.current) setLoading(false);
      }
    // The visible list and suggestions update immediately; the remote refresh waits
    // for a typing pause so Folio stays within Open Library's default request limit.
    }, normalized ? 1000 : 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function chooseSuggestion(title: string) {
    setQuery(title);
    setFocused(false);
    setActiveSuggestion(-1);
    inputRef.current?.focus();
  }

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!suggestions.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setFocused(true);
      setActiveSuggestion((current) => current >= suggestions.length - 1 ? 0 : current + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setFocused(true);
      setActiveSuggestion((current) => current <= 0 ? suggestions.length - 1 : current - 1);
    } else if (event.key === "Enter" && activeSuggestion >= 0) {
      event.preventDefault();
      chooseSuggestion(suggestions[activeSuggestion]);
    } else if (event.key === "Escape") {
      setFocused(false);
      setActiveSuggestion(-1);
    }
  }

  return (
    <section id="discover" className="discovery member-discovery" aria-labelledby="discover-title">
      <div className="discovery-heading">
        <div><p className="eyebrow">Your discovery desk</p><h2 id="discover-title">What do you want to read next?</h2></div>
        <p>Books and covers from <a href="https://openlibrary.org" target="_blank" rel="noopener noreferrer">Open Library<span className="sr-only"> (opens in a new tab)</span></a></p>
      </div>
      <div className="member-search-intro">
        <div>
          <span className="member-kicker">LIVE BOOK SEARCH</span>
          <p>Results narrow as you type. Folio also recognizes close spellings of popular titles.</p>
        </div>
        <div className="search-prompts" aria-label="Suggested searches">
          {["The Hobbit", "Beloved", "Pride and Prejudice", "The Godfather"].map((title) => (
            <button key={title} type="button" onClick={() => chooseSuggestion(title)}>{title}</button>
          ))}
        </div>
      </div>
      <div className="search-form" role="search" aria-label="Book discovery">
        <div className="search-label-row">
          <label htmlFor="book-query">Search by title or author</label>
          <output htmlFor="book-query" aria-live="polite">{visibleCount.toLocaleString()} {visibleCount === 1 ? "book" : "books"}</output>
        </div>
        <div className="search-combobox">
          <div className="search-input-wrap">
            <input
              ref={inputRef}
              id="book-query"
              name="q"
              type="search"
              placeholder="Start typing a title or author"
              maxLength={MAX_QUERY_LENGTH}
              value={query}
              onChange={(event) => { setQuery(event.target.value); setActiveSuggestion(-1); }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={handleSearchKeyDown}
              aria-autocomplete="list"
              aria-controls="book-suggestions"
              aria-expanded={showSuggestions}
              aria-activedescendant={showSuggestions && activeSuggestion >= 0 ? `book-suggestion-${activeSuggestion}` : undefined}
              aria-describedby="search-help"
              role="combobox"
            />
            {loading && <span className="search-spinner" aria-hidden="true" />}
            {query && <button className="search-clear" type="button" onClick={() => { setQuery(""); setActiveSuggestion(-1); inputRef.current?.focus(); }} aria-label="Clear search">Clear</button>}
          </div>
          {showSuggestions && (
            <ul id="book-suggestions" className="search-suggestions" role="listbox" aria-label="Suggested book titles">
              {suggestions.map((title) => (
                <li key={title} role="presentation">
                  <button
                    id={`book-suggestion-${suggestions.indexOf(title)}`}
                    type="button"
                    role="option"
                    aria-selected={activeSuggestion === suggestions.indexOf(title)}
                    tabIndex={-1}
                    onMouseEnter={() => setActiveSuggestion(suggestions.indexOf(title))}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => chooseSuggestion(title)}
                  >
                    <HighlightedTitle title={title} query={query} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <p id="search-help">No submit button needed. We show the best {SEARCH_LIMIT} results and update the total as you type.</p>
      </div>
      <div className="search-feedback" role="status" aria-live="polite" aria-atomic="true">
        {loading && <p>Updating results…</p>}
        {!loading && data && data.books.length > 0 && <p>{trimmedQuery ? `Showing the best matches for “${trimmedQuery}”.` : "Browse the full discovery shelf or start typing to narrow it down."}</p>}
        {!loading && data?.books.length === 0 && (
          <div className="search-empty">
            <h3>No exact books found.</h3>
            <p>Try one of the closest titles:</p>
            <div className="closest-titles">
              {closestTitles.map((title) => <button key={title} type="button" onClick={() => chooseSuggestion(title)}>{title}</button>)}
            </div>
          </div>
        )}
      </div>
      {error && <p className="search-error" role="alert">{error}</p>}
      {visibleBooks.length > 0 && (
        <ul className="book-grid" aria-label="Book search results" aria-busy={loading}>
          {visibleBooks.map((book) => <BookCard key={book.openLibraryKey} book={book} onOpen={() => setSelected(book)} />)}
        </ul>
      )}
      {selected && <BookDetails key={selected.openLibraryKey} book={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}

function isSearchResult(value: unknown): value is BookSearchResult {
  return typeof value === "object" && value !== null
    && "books" in value && Array.isArray(value.books)
    && "total" in value && Number.isSafeInteger(value.total)
    && "totalExact" in value && typeof value.totalExact === "boolean";
}
