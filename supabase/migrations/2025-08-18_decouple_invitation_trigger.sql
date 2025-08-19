-- Decouple invitation/onboarding from auth.users trigger to prevent signup failures

-- 1) Disable the invitation trigger (move logic to API endpoints)
ALTER TABLE auth.users DISABLE TRIGGER trg_attach_membership_from_invitation;

-- 2) Harden the mirror trigger to never throw (non-blocking)
CREATE OR REPLACE FUNCTION public.fn_sync_auth_user_to_app_users()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    IF (TG_OP = 'INSERT') THEN
      INSERT INTO public.app_users (id, email, name, status)
      VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', NULL), 
        'active'
      )
      ON CONFLICT (id) DO UPDATE
        SET email = EXCLUDED.email,
            name  = EXCLUDED.name;
      RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
      UPDATE public.app_users
         SET email = NEW.email,
             name  = COALESCE(NEW.raw_user_meta_data->>'full_name', public.app_users.name)
       WHERE id = NEW.id;
      RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
      DELETE FROM public.app_users WHERE id = OLD.id;
      RETURN OLD;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't block auth.users transaction
    PERFORM pg_notify(
      'onboarding_errors', 
      'app_users_mirror_failed user=' || COALESCE(NEW.id::text, OLD.id::text) || 
      ' op=' || TG_OP || 
      ' err=' || SQLERRM
    );
    RETURN COALESCE(NEW, OLD);
  END;
  
  RETURN NULL;
END;
$$;

-- 3) Drop the invitation trigger function (no longer needed)
DROP FUNCTION IF EXISTS public.fn_attach_membership_from_invitation() CASCADE;
