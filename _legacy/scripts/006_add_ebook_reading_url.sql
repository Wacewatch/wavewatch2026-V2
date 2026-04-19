-- Add reading_url column to ebooks table for online reading feature
ALTER TABLE ebooks ADD COLUMN IF NOT EXISTS reading_url TEXT;

-- Add comment to explain the field
COMMENT ON COLUMN ebooks.reading_url IS 'URL for online reading (linked to "Lire en ligne" button)';
