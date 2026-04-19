-- Create Arcade table
CREATE TABLE IF NOT EXISTS interactive_arcade (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  retrogaming_source_id INTEGER REFERENCES retrogaming_sources(id),
  position_x REAL NOT NULL,
  position_z REAL NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Stadium table
CREATE TABLE IF NOT EXISTS interactive_stadium (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  match_title TEXT,
  embed_url TEXT,
  schedule_start TIMESTAMP WITH TIME ZONE,
  schedule_end TIMESTAMP WITH TIME ZONE,
  is_open BOOLEAN DEFAULT true,
  access_level TEXT DEFAULT 'public',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE interactive_arcade ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactive_stadium ENABLE ROW LEVEL SECURITY;

-- Policies for Arcade
CREATE POLICY "Anyone can view arcade machines" ON interactive_arcade FOR SELECT USING (true);
CREATE POLICY "Admins can manage arcade" ON interactive_arcade FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.is_admin = true
  )
);

-- Policies for Stadium  
CREATE POLICY "Anyone can view stadium" ON interactive_stadium FOR SELECT USING (true);
CREATE POLICY "Admins can manage stadium" ON interactive_stadium FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.is_admin = true
  )
);

-- Insert default Stadium  
INSERT INTO interactive_stadium (name, match_title, is_open, access_level)
VALUES ('Stade Principal', 'Match en direct', true, 'public');
