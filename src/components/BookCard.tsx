import type { Book } from "@/lib/books";
import BookCover from "./BookCover";

export default function BookCard({ book, onOpen }: { book: Book; onOpen: () => void }) {
  return (
    <li className="book-card">
      <button className="book-card-button" onClick={onOpen} aria-label={`View details for ${book.title}`}>
        <BookCover book={book} />
        <h3>{book.title}</h3>
        <p className="book-author">{book.author}</p>
        <p className="book-year">{book.firstPublishYear ?? "Year unknown"}</p>
        <span className="book-detail-link">View details <span aria-hidden="true">↗</span></span>
      </button>
    </li>
  );
}
