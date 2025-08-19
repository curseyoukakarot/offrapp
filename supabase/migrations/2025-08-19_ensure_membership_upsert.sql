-- Ensure membership upsert works properly with unique index
-- This prevents duplicate memberships and ensures ON CONFLICT works

-- Add unique index if missing (required for upsert ON CONFLICT)
CREATE UNIQUE INDEX IF NOT EXISTS ux_memberships_tenant_user ON public.memberships (tenant_id, user_id);

-- Also ensure the memberships table has proper constraints
-- Add status column if missing
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='memberships' AND column_name='status'
  ) THEN
    ALTER TABLE public.memberships ADD COLUMN status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended'));
  END IF;
END $$;

-- Update any existing memberships to have active status
UPDATE public.memberships SET status = 'active' WHERE status IS NULL;
