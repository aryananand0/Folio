"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { LibraryBook, ReadingStatusValue } from "@/lib/library";
import { MAX_NOTES_LENGTH, READING_STATUSES, STATUS_LABELS } from "@/lib/library";
import BookCover from "./BookCover";

type BusyAction = "status" | "review" | "remove" | null;

export default function LibraryBookCard({ book }: { book: LibraryBook }) {
  const router = useRouter();
  const [status, setStatus] = useState(book.status);
  const [rating, setRating] = useState<number | null>(book.rating);
  const [notes, setNotes] = useState(book.notes ?? "");
  const [busy, setBusy] = useState<BusyAction>(null);
  const [message, setMessage] = useState("");

  async function patchBook(update: Record<string, unknown>) {
    const response = await fetch(`/api/library/${book.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(typeof data?.error === "string" ? data.error : "Couldn’t update this book.");
  }

  async function updateStatus(nextStatus: ReadingStatusValue) {
    const previous = status;
    setStatus(nextStatus);
    setBusy("status");
    setMessage("");
    try {
      await patchBook({ status: nextStatus });
      setMessage(`Moved to ${STATUS_LABELS[nextStatus]}.`);
      router.refresh();
    } catch (error) {
      setStatus(previous);
      setMessage(error instanceof Error ? error.message : "Couldn’t update this book.");
    } finally {
      setBusy(null);
    }
  }

  async function saveReview() {
    setBusy("review");
    setMessage("");
    try {
      await patchBook({ rating, notes });
      setNotes(notes.trim());
      setMessage("Rating and notes saved.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Couldn’t save your rating and notes.");
    } finally {
      setBusy(null);
    }
  }

  async function removeBook() {
    if (!window.confirm(`Remove “${book.title}” from your library?`)) return;
    setBusy("remove");
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
      setBusy(null);
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
          disabled={busy !== null}
          onChange={(event) => void updateStatus(event.target.value as ReadingStatusValue)}
        >
          {READING_STATUSES.map((value) => <option key={value} value={value}>{STATUS_LABELS[value]}</option>)}
        </select>

        <div className="review-fields">
          <fieldset disabled={busy !== null}>
            <legend>Your rating</legend>
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map((value) => (
                <label key={value} className={rating !== null && value <= rating ? "star-selected" : ""}>
                  <input
                    type="radio"
                    name={`rating-${book.id}`}
                    value={value}
                    checked={rating === value}
                    onChange={() => setRating(value)}
                  />
                  <span aria-hidden="true">★</span>
                  <span className="sr-only">{value} {value === 1 ? "star" : "stars"}</span>
                </label>
              ))}
              {rating !== null && <button className="clear-rating" type="button" onClick={() => setRating(null)}>Clear</button>}
            </div>
          </fieldset>
          <div className="notes-label-row">
            <label htmlFor={`notes-${book.id}`}>Reading notes</label>
            <span>{notes.length}/{MAX_NOTES_LENGTH}</span>
          </div>
          <textarea
            id={`notes-${book.id}`}
            value={notes}
            maxLength={MAX_NOTES_LENGTH}
            rows={5}
            disabled={busy !== null}
            placeholder="What stayed with you?"
            onChange={(event) => setNotes(event.target.value)}
          />
          <button className="save-review" type="button" disabled={busy !== null} onClick={() => void saveReview()}>
            {busy === "review" ? "Saving…" : "Save rating and notes"}
          </button>
        </div>

        <button className="remove-book" type="button" disabled={busy !== null} onClick={() => void removeBook()}>
          {busy === "remove" ? "Removing…" : "Remove from library"}
        </button>
        <p className="library-action-message" role="status" aria-live="polite">{message}</p>
      </div>
    </article>
  );
}
