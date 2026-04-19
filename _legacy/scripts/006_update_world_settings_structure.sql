-- Updated migration script to ensure proper unique constraint and default values
-- Migration script to adapt interactive_world_settings table
-- The table already exists with a key-value structure (setting_key, setting_value)
-- This script ensures we have the right settings initialized with proper constraints

-- Add unique constraint on setting_key if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'interactive_world_settings_setting_key_key'
  ) THEN
    ALTER TABLE interactive_world_settings 
    ADD CONSTRAINT interactive_world_settings_setting_key_key UNIQUE (setting_key);
  END IF;
END $$;

-- Insert or update default world settings
INSERT INTO interactive_world_settings (id, setting_key, setting_value, updated_by, updated_at)
VALUES 
  (
    gen_random_uuid(),
    'world_config',
    jsonb_build_object(
      'maxCapacity', 100,
      'worldMode', 'day',
      'enableChat', true,
      'enableEmojis', true,
      'enableJumping', true,
      'playerInteractionsEnabled', true,
      'showStatusBadges', true
    ),
    NULL,
    NOW()
  )
ON CONFLICT (setting_key) 
DO UPDATE SET
  updated_at = NOW()
WHERE interactive_world_settings.setting_key = 'world_config'
AND interactive_world_settings.setting_value IS NULL;

-- Create an index on setting_key for faster lookups
CREATE INDEX IF NOT EXISTS idx_interactive_world_settings_key 
ON interactive_world_settings(setting_key);

-- Ensure RLS policies are correct
DROP POLICY IF EXISTS "Anyone can view world settings" ON interactive_world_settings;
DROP POLICY IF EXISTS "Only admins can update world settings" ON interactive_world_settings;

CREATE POLICY "Anyone can view world settings"
ON interactive_world_settings
FOR SELECT
TO public
USING (true);

CREATE POLICY "Only admins can update world settings"
ON interactive_world_settings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.is_admin = true
  )
);

-- Grant necessary permissions
GRANT SELECT ON interactive_world_settings TO anon;
GRANT SELECT ON interactive_world_settings TO authenticated;
GRANT ALL ON interactive_world_settings TO authenticated;
