-- CreateEnum
CREATE TYPE "ReadingStatus" AS ENUM ('WANT_TO_READ', 'READING', 'FINISHED');

-- CreateTable
CREATE TABLE "SavedBook" (
    "id" UUID NOT NULL,
    "clerkUserId" VARCHAR(255) NOT NULL,
    "openLibraryKey" VARCHAR(255) NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "author" VARCHAR(500) NOT NULL,
    "coverId" INTEGER,
    "firstPublishYear" INTEGER,
    "status" "ReadingStatus" NOT NULL DEFAULT 'WANT_TO_READ',
    "rating" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "SavedBook_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SavedBook_rating_check" CHECK ("rating" IS NULL OR "rating" BETWEEN 1 AND 5)
);

-- CreateIndex
CREATE INDEX "SavedBook_clerkUserId_status_idx" ON "SavedBook"("clerkUserId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SavedBook_clerkUserId_openLibraryKey_key" ON "SavedBook"("clerkUserId", "openLibraryKey");
