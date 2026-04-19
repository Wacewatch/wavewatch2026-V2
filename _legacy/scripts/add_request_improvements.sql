-- Add tmdb_id column to content_requests if it doesn't exist
ALTER TABLE content_requests 
ADD COLUMN IF NOT EXISTS tmdb_id INTEGER;

-- Create admin_request_messages table for admin-user messaging
CREATE TABLE IF NOT EXISTS admin_request_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES content_requests(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES user_profiles(user_id),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE
);

-- Add RLS policies for admin_request_messages
ALTER TABLE admin_request_messages ENABLE ROW LEVEL SECURITY;

-- Admins can manage all messages
CREATE POLICY IF NOT EXISTS "Admins can manage all request messages"
  ON admin_request_messages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.is_admin = true
    )
  );

-- Users can view messages related to their requests
CREATE POLICY IF NOT EXISTS "Users can view messages on their requests"
  ON admin_request_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM content_requests 
      WHERE content_requests.id = admin_request_messages.request_id 
      AND content_requests.user_id = auth.uid()
    )
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_admin_request_messages_request_id ON admin_request_messages(request_id);
CREATE INDEX IF NOT EXISTS idx_content_requests_tmdb_id ON content_requests(tmdb_id);
