-- migration_v6: Quote fields - payment methods, contract terms, observations
ALTER TABLE "Quote"
  ADD COLUMN IF NOT EXISTS "contractTerms"   TEXT,
  ADD COLUMN IF NOT EXISTS "observations"    TEXT,
  ADD COLUMN IF NOT EXISTS "paymentMethods"  TEXT;
