-- Add published column to forms table for form publishing status
-- This allows forms to be saved as drafts or published for users to fill out

-- Add published column as boolean with default false (draft)
ALTER TABLE forms ADD COLUMN IF NOT EXISTS published boolean DEFAULT false;

-- Add index for performance when querying published forms
CREATE INDEX IF NOT EXISTS idx_forms_published 
ON forms (published) 
WHERE published = true;

-- Add comment explaining the column
COMMENT ON COLUMN forms.published IS 'Whether the form is published and available for users to fill out. False means draft mode.';
