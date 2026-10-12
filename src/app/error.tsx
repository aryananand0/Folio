"use client";

import Link from "next/link";

export default function ErrorPage({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main id="main-content" className="container app-error" tabIndex={-1}>
      <section className="app-error-card" aria-labelledby="error-title">
        <p className="eyebrow">A page out of place</p>
        <h1 id="error-title">Folio couldn’t load this page.</h1>
        <p>Your account and library data have not been changed. Try the request again or return home.</p>
        <div className="app-error-actions">
          <button className="button" type="button" onClick={retry}>Try again</button>
          <Link className="text-link" href="/">Return home <span aria-hidden="true">→</span></Link>
        </div>
      </section>
    </main>
  );
}
