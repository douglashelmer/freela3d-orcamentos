-- migration_v11.sql
-- Adds imageUrl and links fields to Task (anexar imagem e links nas tarefas)

ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "links" TEXT;
