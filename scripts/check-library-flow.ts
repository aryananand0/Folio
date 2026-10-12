import assert from "node:assert/strict";
import { config as loadEnv } from "dotenv";

loadEnv({ path: [".env.local", ".env"], quiet: true });

const { prisma } = await import("../src/lib/prisma.ts");

const clerkUserId = "folio-phase6-integration-check";
const otherUserId = "folio-phase6-other-user";
const openLibraryKey = "/works/OL999999999W";

try {
  await prisma.savedBook.deleteMany({ where: { clerkUserId: { in: [clerkUserId, otherUserId] }, openLibraryKey } });

  const saved = await prisma.savedBook.upsert({
    where: { clerkUserId_openLibraryKey: { clerkUserId, openLibraryKey } },
    update: {},
    create: { clerkUserId, openLibraryKey, title: "Phase 6 integration check", author: "Folio", status: "WANT_TO_READ" },
  });
  await prisma.savedBook.upsert({
    where: { clerkUserId_openLibraryKey: { clerkUserId, openLibraryKey } },
    update: {},
    create: { clerkUserId, openLibraryKey, title: "Duplicate", author: "Folio" },
  });

  assert.equal(await prisma.savedBook.count({ where: { clerkUserId, openLibraryKey } }), 1);
  assert.equal(saved.status, "WANT_TO_READ");

  const crossOwnerUpdate = await prisma.savedBook.updateMany({
    where: { id: saved.id, clerkUserId: otherUserId },
    data: { status: "FINISHED", rating: 1, notes: "Should not be saved" },
  });
  assert.equal(crossOwnerUpdate.count, 0);

  const ownUpdate = await prisma.savedBook.updateMany({
    where: { id: saved.id, clerkUserId },
    data: { status: "FINISHED", rating: 5, notes: "Persistent phase 6 note" },
  });
  assert.equal(ownUpdate.count, 1);
  const reviewed = await prisma.savedBook.findUniqueOrThrow({
    where: { clerkUserId_openLibraryKey: { clerkUserId, openLibraryKey } },
  });
  assert.equal(reviewed.status, "FINISHED");
  assert.equal(reviewed.rating, 5);
  assert.equal(reviewed.notes, "Persistent phase 6 note");

  await prisma.savedBook.updateMany({
    where: { id: saved.id, clerkUserId },
    data: { rating: null, notes: null },
  });
  const cleared = await prisma.savedBook.findUniqueOrThrow({
    where: { clerkUserId_openLibraryKey: { clerkUserId, openLibraryKey } },
  });
  assert.equal(cleared.rating, null);
  assert.equal(cleared.notes, null);

  const removed = await prisma.savedBook.deleteMany({ where: { id: saved.id, clerkUserId } });
  assert.equal(removed.count, 1);
  assert.equal(await prisma.savedBook.count({ where: { clerkUserId, openLibraryKey } }), 0);

  console.log("Library persistence, duplicate handling, rating and notes updates, clearing, owner isolation, and removal passed.");
} finally {
  await prisma.savedBook.deleteMany({ where: { clerkUserId: { in: [clerkUserId, otherUserId] }, openLibraryKey } });
  await prisma.$disconnect();
}
