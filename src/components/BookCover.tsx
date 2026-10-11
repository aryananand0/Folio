"use client";

import Image from "next/image";
import { useState } from "react";
import type { Book } from "@/lib/books";

export default function BookCover({ book }: { book: Book }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="book-cover">
      {book.coverId && !failed ? (
        <Image
          src={`https://covers.openlibrary.org/b/id/${book.coverId}-M.jpg?default=false`}
          alt={`Cover of ${book.title}`}
          width={180}
          height={270}
          // Covers API already provides a sized image; use its cache directly.
          unoptimized
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="cover-fallback" role="img" aria-label={`No cover available for ${book.title}`}>
          <span aria-hidden="true">folio</span>
          <strong aria-hidden="true">{book.title}</strong>
          <small aria-hidden="true">Cover unavailable</small>
        </div>
      )}
    </div>
  );
}
