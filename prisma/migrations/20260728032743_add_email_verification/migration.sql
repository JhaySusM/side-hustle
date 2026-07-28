-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerificationAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "emailVerificationCodeHash" TEXT,
ADD COLUMN     "emailVerificationExpiresAt" TIMESTAMP(3),
ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3);

-- Backfill: grandfather in every pre-existing account as already verified,
-- so this migration doesn't lock out current users or the admin/support seed accounts.
UPDATE "User" SET "emailVerifiedAt" = "createdAt" WHERE "emailVerifiedAt" IS NULL;
