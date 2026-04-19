-- Table pour stocker les niveaux et XP des utilisateurs
CREATE TABLE IF NOT EXISTS interactive_user_xp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Table pour définir les quêtes disponibles
CREATE TABLE IF NOT EXISTS interactive_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_code VARCHAR(100) NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'exploration', 'social', 'time', 'events'
  xp_reward INTEGER NOT NULL,
  requirement_type VARCHAR(50) NOT NULL, -- 'first_login', 'time_spent', 'visit_room', 'visit_all_rooms', 'chat_messages', 'cinema_sessions', 'avatar_custom', 'voice_chat', 'dance', 'arcade_play'
  requirement_value INTEGER DEFAULT 1,
  is_repeatable BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour suivre la progression des quêtes par utilisateur
CREATE TABLE IF NOT EXISTS interactive_user_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_id UUID NOT NULL REFERENCES interactive_quests(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, quest_id)
);

-- Table pour les items déblocables par niveau
CREATE TABLE IF NOT EXISTS interactive_unlockable_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_code VARCHAR(100) NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL, -- 'accessory', 'hair_style', 'skin_tone', 'body_color', 'emote'
  unlock_level INTEGER NOT NULL,
  item_value TEXT NOT NULL, -- La valeur de l'item (ex: 'hat', '#FF0000', etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour suivre les items débloqués par utilisateur
CREATE TABLE IF NOT EXISTS interactive_user_unlocked_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES interactive_unlockable_items(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

-- RLS Policies
ALTER TABLE interactive_user_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactive_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactive_user_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactive_unlockable_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactive_user_unlocked_items ENABLE ROW LEVEL SECURITY;

-- Policies pour interactive_user_xp
CREATE POLICY "Users can view their own XP"
  ON interactive_user_xp FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own XP"
  ON interactive_user_xp FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own XP"
  ON interactive_user_xp FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies pour interactive_quests
CREATE POLICY "Anyone can view quests"
  ON interactive_quests FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage quests"
  ON interactive_quests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Policies pour interactive_user_quests
CREATE POLICY "Users can view their own quest progress"
  ON interactive_user_quests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quest progress"
  ON interactive_user_quests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quest progress"
  ON interactive_user_quests FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies pour interactive_unlockable_items
CREATE POLICY "Anyone can view unlockable items"
  ON interactive_unlockable_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage unlockable items"
  ON interactive_unlockable_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Policies pour interactive_user_unlocked_items
CREATE POLICY "Users can view their unlocked items"
  ON interactive_user_unlocked_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their unlocked items"
  ON interactive_user_unlocked_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Fonction pour calculer l'XP requis pour chaque niveau
CREATE OR REPLACE FUNCTION calculate_xp_for_level(lvl INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Formule: 100 * level^1.5
  RETURN FLOOR(100 * POWER(lvl, 1.5))::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Fonction pour mettre à jour le niveau quand l'XP change
CREATE OR REPLACE FUNCTION update_user_level()
RETURNS TRIGGER AS $$
DECLARE
  new_level INTEGER;
  xp_for_next_level INTEGER;
BEGIN
  -- Calculer le nouveau niveau basé sur l'XP
  new_level := 1;
  LOOP
    xp_for_next_level := calculate_xp_for_level(new_level + 1);
    EXIT WHEN NEW.xp < xp_for_next_level;
    new_level := new_level + 1;
  END LOOP;
  
  -- Mettre à jour le niveau si différent
  IF new_level != NEW.level THEN
    NEW.level := new_level;
    
    -- Débloquer automatiquement les items pour ce niveau
    INSERT INTO interactive_user_unlocked_items (user_id, item_id)
    SELECT NEW.user_id, id
    FROM interactive_unlockable_items
    WHERE unlock_level <= new_level
    ON CONFLICT (user_id, item_id) DO NOTHING;
  END IF;
  
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour le niveau automatiquement
DROP TRIGGER IF EXISTS trigger_update_user_level ON interactive_user_xp;
CREATE TRIGGER trigger_update_user_level
  BEFORE UPDATE OF xp ON interactive_user_xp
  FOR EACH ROW
  EXECUTE FUNCTION update_user_level();

-- Créer les indexes pour les performances
CREATE INDEX IF NOT EXISTS idx_user_xp_user_id ON interactive_user_xp(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quests_user_id ON interactive_user_quests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quests_quest_id ON interactive_user_quests(quest_id);
CREATE INDEX IF NOT EXISTS idx_unlockable_items_level ON interactive_unlockable_items(unlock_level);
CREATE INDEX IF NOT EXISTS idx_user_unlocked_items_user_id ON interactive_user_unlocked_items(user_id);
