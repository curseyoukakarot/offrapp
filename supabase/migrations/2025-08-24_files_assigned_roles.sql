-- Add assigned_roles column to files table for role-based file assignments
-- This allows files to be assigned to specific roles instead of just individual users

-- Add assigned_roles column as a text array
ALTER TABLE files ADD COLUMN IF NOT EXISTS assigned_roles text[];

-- Add index for performance when querying files by assigned roles
CREATE INDEX IF NOT EXISTS idx_files_assigned_roles 
ON files USING GIN (assigned_roles) 
WHERE assigned_roles IS NOT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN files.assigned_roles IS 'Array of role names that should have access to this file. Used for role-based file assignments.';
