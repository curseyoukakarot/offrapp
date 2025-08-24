-- Add theme column to forms table for form styling/theming
-- This allows forms to have custom themes with colors, fonts, and styling

-- Add theme column as JSONB to store theme configuration
ALTER TABLE forms ADD COLUMN IF NOT EXISTS theme jsonb DEFAULT '{"font": "Inter, sans-serif", "primary": "#3B82F6", "secondary": "#6B7280", "bg": "#FFFFFF", "variant": "solid"}';

-- Add index for performance when querying forms by theme properties
CREATE INDEX IF NOT EXISTS idx_forms_theme_variant 
ON forms USING GIN (theme) 
WHERE theme IS NOT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN forms.theme IS 'JSONB object containing theme configuration including font, primary color, secondary color, background color, and variant (solid/gradient)';
