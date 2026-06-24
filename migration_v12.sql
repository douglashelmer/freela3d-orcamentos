-- migration_v12.sql
-- Adds portalSettings column to User for quote page visual customization

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "portalSettings" TEXT;
