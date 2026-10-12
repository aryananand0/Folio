"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Book } from "@/lib/books";
import BookCover from "./BookCover";

export default function BookDetails({ book, onClose }: { book: Book; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  async function saveBook() {
    if (saveState === "saving" || saveState === "saved") return;
    setSaveState("saving");
    setSaveMessage("");
    try {
      const response = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(book),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Couldn’t save this book.");
      setSaveState("saved");
      setSaveMessage("Saved to Want to Read.");
    } catch (error) {
      setSaveState("error");
      setSaveMessage(error instanceof Error ? error.message : "Couldn’t save this book.");
    }
  }

  return (
    <dialog ref={dialogRef} className="book-dialog" aria-labelledby="detail-title" onClose={(event) => {
      // Strict Mode replays the effect: ignore a queued close event after reopening.
      if (!event.currentTarget.open) onClose();
    }}>
      <button className="dialog-close" onClick={() => dialogRef.current?.close()} aria-label="Close book details">Close <span aria-hidden="true">×</span></button>
      <div className="detail-content">
        <BookCover book={book} />
        <div>
          <p className="eyebrow">From Open Library</p>
          <h2 id="detail-title">{book.title}</h2>
          <p className="detail-author">{book.author}</p>
          <dl><dt>First published</dt><dd>{book.firstPublishYear ?? "Not available"}</dd></dl>
          <a className="text-link" href={`https://openlibrary.org${book.openLibraryKey}`} target="_blank" rel="noopener noreferrer">View on Open Library <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a>
          <div className="detail-save">
            <button className="button" type="button" disabled={saveState === "saving" || saveState === "saved"} onClick={() => void saveBook()}>
              {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : "Save to library"}
            </button>
            {saveState === "saved" && <Link className="text-link" href="/library">View my library</Link>}
          </div>
          <p className={`detail-note${saveState === "error" ? " action-error" : ""}`} role="status" aria-live="polite">
            {saveMessage || "Saved books begin on your Want to Read shelf."}
          </p>
        </div>
      </div>
    </dialog>
  );
}
