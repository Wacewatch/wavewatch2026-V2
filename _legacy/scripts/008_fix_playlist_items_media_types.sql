-- Drop existing constraint and add all media types to playlist_items table
DO $$
BEGIN
    -- Drop the old constraint if it exists
    ALTER TABLE playlist_items DROP CONSTRAINT IF EXISTS playlist_items_media_type_check;
    
    -- Add new constraint with ALL media types including hyphens
    ALTER TABLE playlist_items 
    ADD CONSTRAINT playlist_items_media_type_check 
    CHECK (media_type IN (
        'movie', 
        'tv', 
        'tv-channel', 
        'radio', 
        'game', 
        'ebook', 
        'episode', 
        'music', 
        'software', 
        'retrogaming'
    ));
    
    RAISE NOTICE 'Successfully updated playlist_items media_type constraint';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error updating constraint: %', SQLERRM;
END $$;
