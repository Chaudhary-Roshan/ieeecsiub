-- Migration: Add optional certificate columns and reload schema cache
-- Safe idempotency for certificates table

ALTER TABLE IF EXISTS public.certificates ADD COLUMN IF NOT EXISTS template_id TEXT;
ALTER TABLE IF EXISTS public.certificates ADD COLUMN IF NOT EXISTS team_name TEXT;
ALTER TABLE IF EXISTS public.certificates ADD COLUMN IF NOT EXISTS project_title TEXT;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

