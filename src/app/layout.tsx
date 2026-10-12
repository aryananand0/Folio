import type { Metadata } from "next";
import AuthProvider from "@/components/AuthProvider";
import Header from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Folio | Your books. Your reading journey.",
  description: "Discover books, organize a private reading library, and keep personal ratings and notes with Folio.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <a className="skip-link" href="#main-content">Skip to content</a>
          <Header />
          {children}
          <footer className="site-footer container">
            <span className="footer-brand">folio</span>
            <p>Your books. Your reading journey.</p>
            <span>Made for the love of reading.</span>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
