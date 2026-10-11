import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";
import AuthSetup from "@/components/AuthSetup";
import { isClerkConfigured } from "@/lib/auth-config";

export const metadata: Metadata = { title: "Sign in | Folio" };

export default function SignInPage() {
  if (!isClerkConfigured()) return <AuthSetup />;

  return (
    <main id="main-content" className="container auth-page" tabIndex={-1}>
      <div className="auth-intro">
        <p className="eyebrow">Welcome back</p>
        <h1>Return to your reading life.</h1>
        <p>Sign in to open your private Folio library.</p>
      </div>
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" fallbackRedirectUrl="/library" />
    </main>
  );
}

