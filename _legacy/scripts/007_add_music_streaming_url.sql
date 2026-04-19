-- Add streaming_url column to music_content table for direct listening
ALTER TABLE music_content ADD COLUMN IF NOT EXISTS streaming_url TEXT;

-- Add comment to explain the field
COMMENT ON COLUMN music_content.streaming_url IS 'URL for direct streaming (linked to "Écouter" button)';
