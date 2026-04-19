-- Create football cache table if it doesn't exist
CREATE TABLE IF NOT EXISTS football_cache (
  id BIGSERIAL PRIMARY KEY,
  cache_key TEXT UNIQUE NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Index for faster lookups
  CONSTRAINT football_cache_key_unique UNIQUE (cache_key)
);

-- Create index on expires_at for efficient cleanup
CREATE INDEX IF NOT EXISTS idx_football_cache_expires_at ON football_cache(expires_at);

-- Enable RLS but allow public reads (cache is public data)
ALTER TABLE football_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON football_cache FOR SELECT USING (true);
CREATE POLICY "Allow service role write" ON football_cache FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service role update" ON football_cache FOR UPDATE USING (true);
CREATE POLICY "Allow service role delete" ON football_cache FOR DELETE USING (true);
