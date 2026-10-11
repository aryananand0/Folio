import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { isClerkConfigured } from "@/lib/auth-config";

export default function AuthControls() {
  if (!isClerkConfigured()) {
    return <Link className="auth-link" href="/sign-in">Configure sign-in</Link>;
  }

  return (
    <div className="auth-controls">
      <Show when="signed-out">
        <SignInButton mode="redirect">
          <button className="auth-link" type="button">Sign in</button>
        </SignInButton>
        <SignUpButton mode="redirect">
          <button className="auth-button" type="button">Create account</button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <UserButton />
      </Show>
    </div>
  );
}
