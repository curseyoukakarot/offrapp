-- Add status column to forms table for lifecycle management (draft|published|archived)
ALTER TABLE forms ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft';

-- Optional index to filter by status quickly
CREATE INDEX IF NOT EXISTS idx_forms_status ON forms (status);

COMMENT ON COLUMN forms.status IS 'draft|published|archived lifecycle state for forms';
