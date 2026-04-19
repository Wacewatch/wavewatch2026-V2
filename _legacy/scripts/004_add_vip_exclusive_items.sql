-- Add VIP, VIP+ and Admin exclusive items to avatar customization

-- Premium hairstyles (VIP)
INSERT INTO avatar_customization_options (category, value, label, is_premium) VALUES
('hairStyle', 'messy_bun', 'Chignon Décontracté', true),
('hairStyle', 'undercut', 'Undercut', true),
('hairStyle', 'braids', 'Tresses', true),
('hairStyle', 'mohawk', 'Mohawk', true);

-- VIP+ exclusive hairstyles
INSERT INTO avatar_customization_options (category, value, label, is_premium) VALUES
('hairStyle', 'neon_spikes', 'Pics Néon', true),
('hairStyle', 'galaxy_hair', 'Galaxie', true),
('hairStyle', 'cyberpunk', 'Cyberpunk', true);

-- Admin exclusive hairstyles
INSERT INTO avatar_customization_options (category, value, label, is_premium) VALUES
('hairStyle', 'crown', 'Couronne Royale', true),
('hairStyle', 'halo', 'Halo Admin', true);

-- Premium hair colors (VIP)
INSERT INTO avatar_customization_options (category, value, label, is_premium) VALUES
('hairColor', '#ff1493', 'Rose Vif', true),
('hairColor', '#00ffff', 'Cyan Électrique', true),
('hairColor', '#9d00ff', 'Violet Néon', true);

-- VIP+ exclusive colors
INSERT INTO avatar_customization_options (category, value, label, is_premium) VALUES
('hairColor', 'linear-gradient(90deg, #ff0080, #ff8c00, #ffff00)', 'Arc-en-ciel', true),
('hairColor', 'linear-gradient(90deg, #00ffff, #0080ff, #8000ff)', 'Galaxie', true);

-- Admin exclusive colors
INSERT INTO avatar_customization_options (category, value, label, is_premium) VALUES
('hairColor', '#ffd700', 'Or Admin', true),
('hairColor', 'linear-gradient(90deg, #ff0000, #ffd700)', 'Feu Admin', true);

-- Premium accessories (VIP)
INSERT INTO avatar_customization_options (category, value, label, is_premium) VALUES
('accessory', 'vip_badge', 'Badge VIP', true),
('accessory', 'sunglasses', 'Lunettes de Soleil', true),
('accessory', 'headphones', 'Casque Audio', true),
('accessory', 'cap', 'Casquette', true);

-- VIP+ exclusive accessories
INSERT INTO avatar_customization_options (category, value, label, is_premium) VALUES
('accessory', 'vip_plus_crown', 'Couronne VIP+', true),
('accessory', 'neon_visor', 'Visière Néon', true),
('accessory', 'hologram', 'Hologramme', true);

-- Admin exclusive accessories
INSERT INTO avatar_customization_options (category, value, label, is_premium) VALUES
('accessory', 'admin_crown', 'Couronne Admin', true),
('accessory', 'admin_aura', 'Aura Dorée', true),
('accessory', 'staff_badge', 'Badge Staff', true);

-- Create world settings table
CREATE TABLE IF NOT EXISTS interactive_world_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE interactive_world_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view world settings"
  ON interactive_world_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can update world settings"
  ON interactive_world_settings FOR ALL
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
('world_theme', '{"skyColor": "#1a1a2e", "fogDensity": 0.005, "lightingIntensity": 1.5}'::jsonb),
('world_capacity', '{"maxUsers": 100, "maxPerRoom": 50}'::jsonb),
('cinema_settings', '{"defaultCapacity": 30, "autoStartDelay": 300}'::jsonb),
('vip_features', '{"vipCanCreateRooms": false, "vipPlusCanModerate": true}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;
