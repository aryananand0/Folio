import { ClerkProvider } from "@clerk/nextjs";
import { isClerkConfigured } from "@/lib/auth-config";

export default function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  if (!isClerkConfigured()) return children;

  return (
    <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up">
      {children}
    </ClerkProvider>
  );
}

