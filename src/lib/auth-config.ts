/**
 * Authentication must only switch on when both halves of Clerk's key pair exist.
 * Do not import this module into a Client Component: it reads a server secret.
 */
type AuthEnvironment = Readonly<Record<string, string | undefined>>;

export function isClerkConfigured(env: AuthEnvironment = process.env): boolean {
  const publishableKey = env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  const secretKey = env.CLERK_SECRET_KEY?.trim();

  return Boolean(
    publishableKey?.startsWith("pk_")
      && secretKey?.startsWith("sk_"),
  );
}
