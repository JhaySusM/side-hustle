-- AlterTable
-- Phone/WhatsApp-only accounts have no email; Postgres allows multiple NULLs
-- in a unique column, so the existing @unique constraint still holds.
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;
