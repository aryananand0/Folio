import assert from "node:assert/strict";
import { test } from "node:test";
import { isClerkConfigured } from "../src/lib/auth-config.ts";

test("Clerk configuration requires a valid-looking publishable and secret key pair", () => {
  assert.equal(isClerkConfigured({}), false);
  assert.equal(isClerkConfigured({ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_public" }), false);
  assert.equal(isClerkConfigured({ CLERK_SECRET_KEY: "sk_test_secret" }), false);
  assert.equal(isClerkConfigured({
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "not-a-publishable-key",
    CLERK_SECRET_KEY: "not-a-secret-key",
  }), false);
  assert.equal(isClerkConfigured({
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: " pk_test_public ",
    CLERK_SECRET_KEY: " sk_test_secret ",
  }), true);
});

