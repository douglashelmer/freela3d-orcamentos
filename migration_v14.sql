-- Milestone tracking for achievements push notifications
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "milestonesNotified" TEXT;

-- Contract signing portal
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "token" TEXT;
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'DRAFT';
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "signedAt" TIMESTAMP(3);
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "clientSignature" TEXT;
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "signedByName" TEXT;

-- Generate tokens for existing contracts
CREATE EXTENSION IF NOT EXISTS pgcrypto;
UPDATE "Contract" SET "token" = encode(gen_random_bytes(16), 'hex') WHERE "token" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Contract_token_key" ON "Contract"("token");
