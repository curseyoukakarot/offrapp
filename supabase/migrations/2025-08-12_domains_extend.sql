DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tenant_domains' AND column_name='txt_token'
  ) THEN
    ALTER TABLE public.tenant_domains ADD COLUMN txt_token text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tenant_domains' AND column_name='verified_at'
  ) THEN
    ALTER TABLE public.tenant_domains ADD COLUMN verified_at timestamptz;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tenant_domains' AND column_name='ssl_status'
  ) THEN
    ALTER TABLE public.tenant_domains ADD COLUMN ssl_status text;
  END IF;
END $$;


