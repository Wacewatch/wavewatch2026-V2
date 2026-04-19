-- Create site_settings table for controlling home page modules
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES user_profiles(id)
);

-- Insert default settings for home page modules
INSERT INTO site_settings (setting_key, setting_value)
VALUES 
  ('home_modules', '{
    "hero": true,
    "trending_movies": true,
    "trending_tv_shows": true,
    "popular_anime": true,
    "popular_collections": true,
    "public_playlists": true,
    "trending_actors": true,
    "trending_tv_channels": true,
    "subscription_offer": true,
    "random_content": true,
    "football_calendar": true,
    "calendar_widget": true
  }'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

-- Enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read settings
CREATE POLICY "site_settings_read_policy" ON site_settings
  FOR SELECT USING (true);

-- Policy: Only admins can update settings
CREATE POLICY "site_settings_update_policy" ON site_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );
