import { auth } from "@clerk/nextjs/server";
import { parseBookToSave } from "@/lib/library";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Sign in to save books." }, { status: 401 });

  let book;
  try {
    book = parseBookToSave(await request.json());
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Book details are invalid." }, { status: 400 });
  }

  try {
    const saved = await prisma.savedBook.upsert({
      where: { clerkUserId_openLibraryKey: { clerkUserId: userId, openLibraryKey: book.openLibraryKey } },
      update: {},
      create: { clerkUserId: userId, ...book },
      select: { id: true },
    });
    return Response.json({ bookId: saved.id });
  } catch {
    return Response.json({ error: "Couldn’t save this book. Please try again." }, { status: 500 });
  }
}
