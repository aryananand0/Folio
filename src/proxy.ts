import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isClerkConfigured } from "@/lib/auth-config";

// Clerk must see requests before auth() can read the verified session. Until the
// owner supplies both keys, the proxy deliberately passes requests through so a
// fresh clone can render its setup checkpoint and run a production build.
const folioProxy = isClerkConfigured()
  ? clerkMiddleware({
      signInUrl: "/sign-in",
      signUpUrl: "/sign-up",
    })
  : () => NextResponse.next();

export default folioProxy;

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
