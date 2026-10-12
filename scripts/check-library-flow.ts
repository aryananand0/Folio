import assert from "node:assert/strict";
import { config as loadEnv } from "dotenv";

loadEnv({ path: [".env.local", ".env"], quiet: true });

const { prisma } = await import("../src/lib/prisma.ts");

const clerkUserId = "folio-phase5-integration-check";
const otherUserId = "folio-phase5-other-user";
const openLibraryKey = "/works/OL999999999W";

try {
  await prisma.savedBook.deleteMany({ where: { clerkUserId: { in: [clerkUserId, otherUserId] }, openLibraryKey } });

  const saved = await prisma.savedBook.upsert({
    where: { clerkUserId_openLibraryKey: { clerkUserId, openLibraryKey } },
    update: {},
    create: { clerkUserId, openLibraryKey, title: "Phase 5 integration check", author: "Folio", status: "WANT_TO_READ" },
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
    data: { status: "FINISHED" },
  });
  assert.equal(crossOwnerUpdate.count, 0);

  const ownUpdate = await prisma.savedBook.updateMany({
    where: { id: saved.id, clerkUserId },
    data: { status: "READING" },
  });
  assert.equal(ownUpdate.count, 1);
  assert.equal(await prisma.savedBook.count({ where: { clerkUserId, status: "READING" } }), 1);

  const removed = await prisma.savedBook.deleteMany({ where: { id: saved.id, clerkUserId } });
  assert.equal(removed.count, 1);
  assert.equal(await prisma.savedBook.count({ where: { clerkUserId, openLibraryKey } }), 0);

  console.log("Library persistence, duplicate handling, status filtering, owner isolation, and removal passed.");
} finally {
  await prisma.savedBook.deleteMany({ where: { clerkUserId: { in: [clerkUserId, otherUserId] }, openLibraryKey } });
  await prisma.$disconnect();
}
