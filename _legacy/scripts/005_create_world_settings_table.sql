-- Create interactive_world_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS interactive_world_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  updated_by UUID REFERENCES user_profiles(user_id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE interactive_world_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view world settings
CREATE POLICY "Anyone can view world settings"
  ON interactive_world_settings
  FOR SELECT
  TO public
  USING (true);

-- Only admins can update world settings
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

-- Insert default settings
INSERT INTO interactive_world_settings (setting_key, setting_value) VALUES
  ('world_config', '{"maxCapacity": 100, "worldMode": "day", "playerInteractionsEnabled": true, "showStatusBadges": true, "enableChat": true, "enableEmojis": true, "enableJumping": true}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;
