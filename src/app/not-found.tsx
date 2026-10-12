import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Page not found | Folio" };

export default function NotFound() {
  return (
    <main id="main-content" className="container app-error" tabIndex={-1}>
      <section className="app-error-card" aria-labelledby="not-found-title">
        <p className="eyebrow">Page not found</p>
        <h1 id="not-found-title">This page isn’t on the shelf.</h1>
        <p>The address may have changed, or the page may no longer exist.</p>
        <div className="app-error-actions">
          <Link className="button" href="/">Return to Folio</Link>
          <Link className="text-link" href="/library">Open my library <span aria-hidden="true">→</span></Link>
        </div>
      </section>
    </main>
  );
}
