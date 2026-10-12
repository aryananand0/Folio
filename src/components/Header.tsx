import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { isClerkConfigured } from "@/lib/auth-config";
import AuthControls from "./AuthControls";

export default async function Header() {
  const signedIn = isClerkConfigured() ? Boolean((await auth()).userId) : false;

  return (
    <header className="site-header container">
      <Link className="wordmark" href="/" aria-label="Folio home">
        <span className="brand-mark" aria-hidden="true">f.</span>folio
      </Link>
      <span className="header-note">A home for your reading life</span>
      <nav className="primary-nav" aria-label="Primary navigation">
        {signedIn && <Link className="text-link" href="/#discover">Discover</Link>}
        <Link className="text-link" href="/library">My library</Link>
        <AuthControls />
      </nav>
    </header>
  );
}
