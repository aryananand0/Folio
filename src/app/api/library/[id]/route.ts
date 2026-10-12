import { auth } from "@clerk/nextjs/server";
import { parseBookId, parseReadingStatus } from "@/lib/library";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

async function getOwnerAndBookId(context: RouteContext) {
  const [{ userId }, { id }] = await Promise.all([auth(), context.params]);
  if (!userId) return { error: Response.json({ error: "Sign in to manage your library." }, { status: 401 }) };
  try {
    return { userId, bookId: parseBookId(id) };
  } catch (error) {
    return { error: Response.json({ error: error instanceof Error ? error.message : "Book ID is invalid." }, { status: 400 }) };
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const owner = await getOwnerAndBookId(context);
  if ("error" in owner) return owner.error;

  let status;
  try {
    const body: unknown = await request.json();
    status = parseReadingStatus(typeof body === "object" && body !== null && "status" in body ? body.status : undefined);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Reading status is invalid." }, { status: 400 });
  }

  try {
    const result = await prisma.savedBook.updateMany({
      where: { id: owner.bookId, clerkUserId: owner.userId },
      data: { status },
    });
    if (result.count === 0) return Response.json({ error: "Book not found." }, { status: 404 });
    return Response.json({ status });
  } catch {
    return Response.json({ error: "Couldn’t update this book. Please try again." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const owner = await getOwnerAndBookId(context);
  if ("error" in owner) return owner.error;

  try {
    const result = await prisma.savedBook.deleteMany({
      where: { id: owner.bookId, clerkUserId: owner.userId },
    });
    if (result.count === 0) return Response.json({ error: "Book not found." }, { status: 404 });
    return new Response(null, { status: 204 });
  } catch {
    return Response.json({ error: "Couldn’t remove this book. Please try again." }, { status: 500 });
  }
}
