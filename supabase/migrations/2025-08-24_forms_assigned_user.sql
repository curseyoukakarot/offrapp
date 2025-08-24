-- Allow assigning a form to a specific user as an alternative to roles
ALTER TABLE forms ADD COLUMN IF NOT EXISTS assigned_user_id uuid REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_forms_assigned_user_id ON forms (assigned_user_id);

COMMENT ON COLUMN forms.assigned_user_id IS 'If set, only this user can access the form (besides admins).';


