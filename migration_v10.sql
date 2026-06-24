-- migration_v10.sql
-- Adds CPF/CNPJ field to User and creates ContractTemplate + Contract tables

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "document" TEXT;

CREATE TABLE IF NOT EXISTS "ContractTemplate" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "content"   TEXT NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContractTemplate_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ContractTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Contract" (
  "id"                   TEXT NOT NULL,
  "userId"               TEXT NOT NULL,
  "templateId"           TEXT,
  "clientName"           TEXT NOT NULL,
  "clientDocument"       TEXT,
  "clientRepresentative" TEXT,
  "clientEmail"          TEXT,
  "clientPhone"          TEXT,
  "clientAddress"        TEXT,
  "clientAddressNumber"  TEXT,
  "clientNeighborhood"   TEXT,
  "clientCity"           TEXT,
  "clientState"          TEXT,
  "projectName"          TEXT NOT NULL,
  "services"             TEXT,
  "duration"             TEXT NOT NULL DEFAULT '90 dias a partir da assinatura',
  "totalValue"           DOUBLE PRECISION NOT NULL DEFAULT 0,
  "discount"             DOUBLE PRECISION NOT NULL DEFAULT 0,
  "finalValue"           DOUBLE PRECISION NOT NULL DEFAULT 0,
  "installments"         INTEGER NOT NULL DEFAULT 1,
  "paymentMethod"        TEXT NOT NULL DEFAULT 'PIX',
  "paymentConditions"    TEXT NOT NULL DEFAULT 'À vista',
  "generatedContent"     TEXT NOT NULL,
  "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Contract_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Contract_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
