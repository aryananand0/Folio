import "server-only";

import type { ReadingStatus } from "../generated/prisma/enums";
import { prisma } from "./prisma";
import type { LibraryBook, LibraryFilter, ReadingStatusValue } from "./library";

export type LibrarySummary = Record<"total" | ReadingStatusValue, number>;

export async function getLibrary(userId: string, filter: LibraryFilter) {
  const owner = { clerkUserId: userId };
  const [records, groupedCounts] = await Promise.all([
    prisma.savedBook.findMany({
      where: filter === "ALL" ? owner : { ...owner, status: filter as ReadingStatus },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        openLibraryKey: true,
        title: true,
        author: true,
        coverId: true,
        firstPublishYear: true,
        status: true,
      },
    }),
    prisma.savedBook.groupBy({
      by: ["status"],
      where: owner,
      _count: { _all: true },
    }),
  ]);

  const summary: LibrarySummary = { total: 0, WANT_TO_READ: 0, READING: 0, FINISHED: 0 };
  for (const row of groupedCounts) {
    summary[row.status] = row._count._all;
    summary.total += row._count._all;
  }

  return { books: records as LibraryBook[], summary };
}
