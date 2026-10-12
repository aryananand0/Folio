"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { LibraryBook, ReadingStatusValue } from "@/lib/library";
import { READING_STATUSES, STATUS_LABELS } from "@/lib/library";
import BookCover from "./BookCover";

export default function LibraryBookCard({ book }: { book: LibraryBook }) {
  const router = useRouter();
  const [status, setStatus] = useState(book.status);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function updateStatus(nextStatus: ReadingStatusValue) {
    const previous = status;
    setStatus(nextStatus);
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/library/${book.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = response.status === 204 ? null : await response.json();
      if (!response.ok) throw new Error(typeof data?.error === "string" ? data.error : "Couldn’t update this book.");
      setMessage(`Moved to ${STATUS_LABELS[nextStatus]}.`);
      router.refresh();
    } catch (error) {
      setStatus(previous);
      setMessage(error instanceof Error ? error.message : "Couldn’t update this book.");
    } finally {
      setBusy(false);
    }
  }

  async function removeBook() {
    if (!window.confirm(`Remove “${book.title}” from your library?`)) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/library/${book.id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(typeof data?.error === "string" ? data.error : "Couldn’t remove this book.");
      }
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Couldn’t remove this book.");
      setBusy(false);
    }
  }

  return (
    <article className="library-book-card">
      <BookCover book={book} />
      <div className="library-book-copy">
        <span className={`status-badge status-${status.toLowerCase().replaceAll("_", "-")}`}>{STATUS_LABELS[status]}</span>
        <h2>{book.title}</h2>
        <p className="book-author">{book.author}</p>
        <p className="book-year">First published {book.firstPublishYear ?? "year unknown"}</p>
        <label htmlFor={`status-${book.id}`}>Reading status</label>
        <select
          id={`status-${book.id}`}
          value={status}
          disabled={busy}
          onChange={(event) => void updateStatus(event.target.value as ReadingStatusValue)}
        >
          {READING_STATUSES.map((value) => <option key={value} value={value}>{STATUS_LABELS[value]}</option>)}
        </select>
        <button className="remove-book" type="button" disabled={busy} onClick={() => void removeBook()}>
          {busy ? "Saving…" : "Remove from library"}
        </button>
        <p className="library-action-message" role="status" aria-live="polite">{message}</p>
      </div>
    </article>
  );
}
