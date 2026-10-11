import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import Link from "next/link";
import AuthSetup from "@/components/AuthSetup";
import { isClerkConfigured } from "@/lib/auth-config";

export const metadata: Metadata = { title: "My library | Folio" };

export default async function LibraryPage() {
  if (!isClerkConfigured()) return <AuthSetup />;

  // This check lives beside the private resource. Future database reads and
  // writes will repeat the same server-side identity check.
  await auth.protect();

  return (
    <main id="main-content" className="container library-page" tabIndex={-1}>
      <div className="library-heading">
        <div>
          <p className="eyebrow">Your private collection</p>
          <h1>My library</h1>
          <p>Your signed-in session is verified on the server before this page renders.</p>
        </div>
        <Link className="button" href="/#discover">Discover books <span aria-hidden="true">↗</span></Link>
      </div>
      <section className="library-empty" aria-labelledby="library-empty-title">
        <span className="empty-book" aria-hidden="true">f.</span>
        <h2 id="library-empty-title">Your shelf is ready for its first book.</h2>
        <p>Database-backed saving arrives in the personal library milestone. For now, this protected page verifies that only a signed-in user can reach the private library area.</p>
      </section>
    </main>
  );
}

