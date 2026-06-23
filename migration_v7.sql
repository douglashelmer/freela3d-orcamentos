-- migration_v7: Briefing model
CREATE TABLE IF NOT EXISTS "Briefing" (
  "id"          TEXT        NOT NULL,
  "userId"      TEXT        NOT NULL,
  "token"       TEXT        NOT NULL,
  "type"        TEXT        NOT NULL DEFAULT 'OTHER',
  "clientName"  TEXT        NOT NULL,
  "clientEmail" TEXT        NOT NULL,
  "quoteId"     TEXT,
  "status"      TEXT        NOT NULL DEFAULT 'PENDING',
  "projectType" TEXT,
  "description" TEXT,
  "references"  TEXT,
  "deadline"    TEXT,
  "budget"      TEXT,
  "answeredAt"  TIMESTAMPTZ,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Briefing_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Briefing_token_key" UNIQUE ("token"),
  CONSTRAINT "Briefing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
