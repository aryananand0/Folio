import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";
import AuthSetup from "@/components/AuthSetup";
import { isClerkConfigured } from "@/lib/auth-config";

export const metadata: Metadata = { title: "Create an account | Folio" };

export default function SignUpPage() {
  if (!isClerkConfigured()) return <AuthSetup />;

  return (
    <main id="main-content" className="container auth-page" tabIndex={-1}>
      <div className="auth-intro">
        <p className="eyebrow">Begin your Folio</p>
        <h1>Make your reading life your own.</h1>
        <p>Create an account to start a private library in the next milestone.</p>
      </div>
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" fallbackRedirectUrl="/library" />
    </main>
  );
}

