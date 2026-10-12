-- Keep direct Data API access closed; Folio reaches this table through its
-- server-only Prisma connection and enforces Clerk ownership in server code.
ALTER TABLE "SavedBook" ENABLE ROW LEVEL SECURITY;
