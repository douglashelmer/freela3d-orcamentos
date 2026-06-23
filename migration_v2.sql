-- migration_v2.sql — rodar no DbGate (freela3d_orcamentos)

-- Adicionar colunas ao User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "company" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "logo" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "specialty" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "neighborhood" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "state" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "zipCode" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "monthlyGoal" DOUBLE PRECISION;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "onboardingCompleted" BOOLEAN DEFAULT true;

-- Usuários existentes ficam com onboarding=true (não serão redirecionados)
UPDATE "User" SET "onboardingCompleted" = true WHERE "onboardingCompleted" IS NULL;

-- Torna NOT NULL e muda o default para false (novos usuários precisam do onboarding)
ALTER TABLE "User" ALTER COLUMN "onboardingCompleted" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "onboardingCompleted" SET DEFAULT false;

-- Criar tabela Service
CREATE TABLE IF NOT EXISTS "Service" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT NOT NULL,
  "price" DOUBLE PRECISION NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Service_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Service_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
