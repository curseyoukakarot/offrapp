-- Add support for super admin cross-tenant embeds
-- This allows super admins to send embeds to any user across all tenants

-- Add column to track super admin embeds
ALTER TABLE embeds ADD COLUMN IF NOT EXISTS is_super_admin_embed BOOLEAN DEFAULT FALSE;

-- Add index for performance when querying super admin embeds
CREATE INDEX IF NOT EXISTS idx_embeds_super_admin_user 
ON embeds (is_super_admin_embed, user_id) 
WHERE is_super_admin_embed = TRUE;

-- Add comment explaining the feature
COMMENT ON COLUMN embeds.is_super_admin_embed IS 'Marks embeds created by super admins that should be visible across all tenants to the target user';
