-- Add is_uploader column to user_profiles table
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_uploader BOOLEAN DEFAULT FALSE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_uploader ON user_profiles(is_uploader);

-- Add comment to explain the column
COMMENT ON COLUMN user_profiles.is_uploader IS 'Indicates if user has Uploader privileges (can create/edit but not delete content in admin)';
