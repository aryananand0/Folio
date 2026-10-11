import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Folio | Your books. Your reading journey.",
  description: "Discover books by title or author with Folio. A thoughtful home for your reading life, with personal libraries coming soon.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <header className="site-header container">
          <Link className="wordmark" href="/" aria-label="Folio home">
            <span className="brand-mark" aria-hidden="true">f.</span>folio
          </Link>
          <span className="header-note">A home for your reading life</span>
          <a className="text-link" href="#about">About Folio <span aria-hidden="true">↗</span></a>
        </header>
        {children}
        <footer className="site-footer container">
          <span className="footer-brand">folio</span>
          <p>Your books. Your reading journey.</p>
          <span>Made for the love of reading.</span>
        </footer>
      </body>
    </html>
  );
}
