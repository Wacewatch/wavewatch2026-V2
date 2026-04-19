-- Create votes table for content requests
CREATE TABLE IF NOT EXISTS content_request_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES content_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(request_id, user_id)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_content_request_votes_request_id ON content_request_votes(request_id);
CREATE INDEX IF NOT EXISTS idx_content_request_votes_user_id ON content_request_votes(user_id);

-- Enable RLS
ALTER TABLE content_request_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view votes" ON content_request_votes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote" ON content_request_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own votes" ON content_request_votes
  FOR DELETE USING (auth.uid() = user_id);
