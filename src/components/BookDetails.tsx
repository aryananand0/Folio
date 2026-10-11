"use client";

import { useEffect, useRef } from "react";
import type { Book } from "@/lib/books";
import BookCover from "./BookCover";

export default function BookDetails({ book, onClose }: { book: Book; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

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
          <p className="detail-note">Your personal shelf is coming soon. Saving books, ratings, and notes will be available after accounts and libraries are connected.</p>
        </div>
      </div>
    </dialog>
  );
}
