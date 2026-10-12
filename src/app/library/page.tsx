import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import Link from "next/link";
import AuthSetup from "@/components/AuthSetup";
import LibraryBookCard from "@/components/LibraryBookCard";
import { isClerkConfigured } from "@/lib/auth-config";
import { parseLibraryFilter, STATUS_LABELS, type LibraryFilter } from "@/lib/library";
import { getLibrary } from "@/lib/saved-books";

export const metadata: Metadata = { title: "My library | Folio" };

const FILTERS: LibraryFilter[] = ["ALL", "WANT_TO_READ", "READING", "FINISHED"];

export default async function LibraryPage({ searchParams }: { searchParams: Promise<{ status?: string | string[] }> }) {
  if (!isClerkConfigured()) return <AuthSetup />;

  const [{ userId }, params] = await Promise.all([auth.protect(), searchParams]);
  const activeFilter = parseLibraryFilter(params.status);
  const { books, summary } = await getLibrary(userId, activeFilter);

  return (
    <main id="main-content" className="container library-page" tabIndex={-1}>
      <div className="library-heading">
        <div>
          <p className="eyebrow">Your private collection</p>
          <h1>My library</h1>
          <p>Organize the books you want to read, are reading, and have finished.</p>
        </div>
        <Link className="button" href="/#discover">Discover books <span aria-hidden="true">↗</span></Link>
      </div>
      <section className="library-summary" aria-label="Reading summary">
        <div><strong>{summary.total}</strong><span>Total books</span></div>
        <div><strong>{summary.WANT_TO_READ}</strong><span>Want to Read</span></div>
        <div><strong>{summary.READING}</strong><span>Reading</span></div>
        <div><strong>{summary.FINISHED}</strong><span>Finished</span></div>
      </section>
      <nav className="library-filters" aria-label="Filter library by reading status">
        {FILTERS.map((filter) => {
          const label = filter === "ALL" ? "All" : STATUS_LABELS[filter];
          const href = filter === "ALL" ? "/library" : `/library?status=${filter}`;
          return <Link key={filter} href={href} aria-current={activeFilter === filter ? "page" : undefined}>{label}</Link>;
        })}
      </nav>
      {books.length > 0 ? (
        <section className="library-grid" aria-label={`${activeFilter === "ALL" ? "All" : STATUS_LABELS[activeFilter]} books`}>
          {books.map((book) => <LibraryBookCard key={book.id} book={book} />)}
        </section>
      ) : (
        <section className="library-empty" aria-labelledby="library-empty-title">
          <span className="empty-book" aria-hidden="true">f.</span>
          <h2 id="library-empty-title">{summary.total === 0 ? "Your shelf is ready for its first book." : "No books on this shelf yet."}</h2>
          <p>{summary.total === 0 ? "Discover a book and save it here. It will begin on your Want to Read shelf." : "Choose another filter or update a book’s reading status."}</p>
          {summary.total === 0 && <Link className="text-link" href="/#discover">Find your first book <span aria-hidden="true">→</span></Link>}
        </section>
      )}
    </main>
  );
}
