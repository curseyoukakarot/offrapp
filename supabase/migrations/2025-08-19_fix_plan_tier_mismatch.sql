-- Fix plan/tier mismatch: migrate tier column values to plan column
-- This addresses the issue where tenants created with 'tier' aren't reflected in 'plan'

-- Update plan column to use tier value where plan is null or starter but tier is different
UPDATE public.tenants 
SET plan = tier 
WHERE tier IS NOT NULL 
  AND tier != 'starter' 
  AND (plan IS NULL OR plan = 'starter');

-- Also migrate seats if needed
UPDATE public.tenants 
SET seats_purchased = GREATEST(seats_total, seats_purchased, 1)
WHERE seats_total IS NOT NULL 
  AND seats_total > COALESCE(seats_purchased, 0);

-- Log the changes
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN SELECT id, name, tier, plan, seats_total, seats_purchased FROM public.tenants
  LOOP
    RAISE NOTICE 'Tenant %: tier=%, plan=%, seats_total=%, seats_purchased=%', 
      rec.name, rec.tier, rec.plan, rec.seats_total, rec.seats_purchased;
  END LOOP;
END $$;
