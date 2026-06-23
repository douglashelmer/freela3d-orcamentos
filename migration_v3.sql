-- Client enhancements
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "neighborhood" TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "state" TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "zipCode" TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "tags" TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "birthDate" TIMESTAMPTZ;

-- Lead table
CREATE TABLE IF NOT EXISTS "Lead" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "document" TEXT,
  "zipCode" TEXT,
  "address" TEXT,
  "neighborhood" TEXT,
  "city" TEXT,
  "state" TEXT,
  "project" TEXT,
  "estimatedValue" DOUBLE PRECISION,
  "birthDate" TIMESTAMPTZ,
  "tags" TEXT,
  "notes" TEXT,
  "column" TEXT NOT NULL DEFAULT 'NEW',
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Lead_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Lead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Transaction table
CREATE TABLE IF NOT EXISTS "Transaction" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "dueDate" TIMESTAMPTZ NOT NULL,
  "paidAt" TIMESTAMPTZ,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "category" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
