"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { MAX_QUERY_LENGTH, SEARCH_LIMIT, validateQuery, type Book } from "@/lib/books";
import BookCard from "./BookCard";
import BookDetails from "./BookDetails";

type SearchState =
  | { kind: "idle" }
  | { kind: "loading"; query: string }
  | { kind: "success"; query: string; books: Book[] }
  | { kind: "error"; message: string };

const MEMBER_SUGGESTIONS = [
  "The Hobbit",
  "Beloved",
  "Pride and Prejudice",
  "The Left Hand of Darkness",
  "James Baldwin",
  "Toni Morrison",
];

export default function BookSearch() {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<SearchState>({ kind: "idle" });
  const [selected, setSelected] = useState<Book | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const lastSearchAt = useRef(0);

  useEffect(() => () => controllerRef.current?.abort(), []);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Ref guard also prevents rapid submissions before React updates the button.
    if (controllerRef.current) return;
    let term: string;
    try {
      term = validateQuery(query);
    } catch (error) {
      setState({ kind: "error", message: (error as Error).message });
      return;
    }
    if (Date.now() - lastSearchAt.current < 1100) {
      setState({ kind: "error", message: "Please wait a second before searching again." });
      return;
    }
    lastSearchAt.current = Date.now();
    const controller = new AbortController();
    controllerRef.current = controller;
    setSelected(null);
    setState({ kind: "loading", query: term });
    try {
      const response = await fetch(`/api/books/search?${new URLSearchParams({ q: term })}`, {
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15_000)]),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Search is unavailable. Please try again.");
      if (!Array.isArray(data.books)) throw new Error("Search returned an unexpected response. Please try again.");
      setState({ kind: "success", query: term, books: data.books });
    } catch (error) {
      if (controller.signal.aborted) return;
      setState({ kind: "error", message: error instanceof Error && error.name === "TimeoutError"
        ? "Search took too long. Please try again."
        : error instanceof Error && error.name === "Error"
          ? error.message : "Couldn’t connect to search. Check your connection and try again." });
    } finally {
      controllerRef.current = null;
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
          <span className="member-kicker">SIGNED-IN SEARCH</span>
          <p>Start typing to see completions, or choose a prompt to fill the search box.</p>
        </div>
        <div className="search-prompts" aria-label="Suggested searches">
          {MEMBER_SUGGESTIONS.slice(0, 4).map((suggestion) => (
            <button key={suggestion} type="button" onClick={() => { setQuery(suggestion); inputRef.current?.focus(); }}>{suggestion}</button>
          ))}
        </div>
      </div>
      <form className="search-form" onSubmit={handleSearch} role="search" aria-label="Book discovery" noValidate>
        <label htmlFor="book-query">Search by title or author</label>
        <div className="search-controls">
          <input ref={inputRef} id="book-query" name="q" type="search" list="member-search-completions" placeholder="Start typing a title or author" maxLength={MAX_QUERY_LENGTH} value={query} onChange={(event) => setQuery(event.target.value)} aria-describedby="search-help" />
          <datalist id="member-search-completions">{MEMBER_SUGGESTIONS.map((suggestion) => <option key={suggestion} value={suggestion} />)}</datalist>
          <button className="button" type="submit" disabled={state.kind === "loading"}>{state.kind === "loading" ? "Searching…" : "Search books"}</button>
        </div>
        <p id="search-help">Search completion is on. Choose a suggestion or finish your own query. We’ll show up to {SEARCH_LIMIT} matching books.</p>
      </form>
      <div className="search-feedback" role="status" aria-live="polite" aria-atomic="true">
        {state.kind === "idle" && <p>Your next read starts here. Enter a title or an author above.</p>}
        {state.kind === "loading" && <p>Searching for “{state.query}”…</p>}
        {state.kind === "success" && (state.books.length
          ? <p>Showing {state.books.length} {state.books.length === 1 ? "book" : "books"} for “{state.query}”. Refine your search to find a specific title.</p>
          : <div className="search-empty"><h3>No books found.</h3><p>We couldn’t find a match for “{state.query}”. Try a shorter title, an author’s name, or check the spelling.</p></div>)}
      </div>
      {state.kind === "error" && <p className="search-error" role="alert">{state.message}</p>}
      {state.kind === "success" && state.books.length > 0 && (
        <ul className="book-grid" aria-label="Book search results">
          {state.books.map((book) => <BookCard key={book.openLibraryKey} book={book} onOpen={() => setSelected(book)} />)}
        </ul>
      )}
      {selected && <BookDetails key={selected.openLibraryKey} book={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}
