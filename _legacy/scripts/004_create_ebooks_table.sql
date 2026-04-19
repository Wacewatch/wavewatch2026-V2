-- Create ebooks table for managing ebook downloads
CREATE TABLE IF NOT EXISTS ebooks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255),
  description TEXT,
  cover_url TEXT,
  download_url TEXT,
  isbn VARCHAR(20),
  publication_date DATE,
  publisher VARCHAR(255),
  category VARCHAR(100), -- Fiction, Non-Fiction, Science, Technology, etc.
  language VARCHAR(50),
  pages INTEGER,
  file_format VARCHAR(20), -- PDF, EPUB, MOBI
  file_size VARCHAR(50),
  downloads INTEGER DEFAULT 0,
  rating DECIMAL(2,1), -- 0.0 to 5.0
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ebooks_category ON ebooks(category);
CREATE INDEX IF NOT EXISTS idx_ebooks_author ON ebooks(author);
CREATE INDEX IF NOT EXISTS idx_ebooks_active ON ebooks(is_active);

-- Enable Row Level Security
ALTER TABLE ebooks ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view active ebooks
CREATE POLICY "Anyone can view active ebooks"
  ON ebooks
  FOR SELECT
  USING (is_active = true);

-- Policy: Only admins can insert ebooks
CREATE POLICY "Admins can insert ebooks"
  ON ebooks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Policy: Only admins can update ebooks
CREATE POLICY "Admins can update ebooks"
  ON ebooks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Policy: Only admins can delete ebooks
CREATE POLICY "Admins can delete ebooks"
  ON ebooks
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );
