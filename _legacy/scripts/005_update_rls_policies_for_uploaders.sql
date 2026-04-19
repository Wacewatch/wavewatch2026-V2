-- Script pour permettre aux uploaders d'ajouter, modifier et supprimer du contenu
-- dans les tables ebooks, games, software et music_content

-- ======================================
-- TABLE: ebooks
-- ======================================

-- Supprimer les anciennes politiques admin uniquement
DROP POLICY IF EXISTS "Admins can insert ebooks" ON public.ebooks;
DROP POLICY IF EXISTS "Admins can update ebooks" ON public.ebooks;
DROP POLICY IF EXISTS "Admins can delete ebooks" ON public.ebooks;

-- Créer les nouvelles politiques pour admins ET uploaders
CREATE POLICY "Admins and uploaders can insert ebooks"
ON public.ebooks
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND (is_admin = true OR is_uploader = true)
  )
);

CREATE POLICY "Admins and uploaders can update ebooks"
ON public.ebooks
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND (is_admin = true OR is_uploader = true)
  )
);

CREATE POLICY "Admins and uploaders can delete ebooks"
ON public.ebooks
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND (is_admin = true OR is_uploader = true)
  )
);

-- ======================================
-- TABLE: games
-- ======================================

-- Supprimer les anciennes politiques admin uniquement
DROP POLICY IF EXISTS "Admins can insert games" ON public.games;
DROP POLICY IF EXISTS "Admins can update games" ON public.games;
DROP POLICY IF EXISTS "Admins can delete games" ON public.games;

-- Créer les nouvelles politiques pour admins ET uploaders
CREATE POLICY "Admins and uploaders can insert games"
ON public.games
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND (is_admin = true OR is_uploader = true)
  )
);

CREATE POLICY "Admins and uploaders can update games"
ON public.games
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND (is_admin = true OR is_uploader = true)
  )
);

CREATE POLICY "Admins and uploaders can delete games"
ON public.games
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND (is_admin = true OR is_uploader = true)
  )
);

-- ======================================
-- TABLE: software
-- ======================================

-- Supprimer les anciennes politiques admin uniquement
DROP POLICY IF EXISTS "Admins can insert software" ON public.software;
DROP POLICY IF EXISTS "Admins can update software" ON public.software;
DROP POLICY IF EXISTS "Admins can delete software" ON public.software;

-- Créer les nouvelles politiques pour admins ET uploaders
CREATE POLICY "Admins and uploaders can insert software"
ON public.software
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND (is_admin = true OR is_uploader = true)
  )
);

CREATE POLICY "Admins and uploaders can update software"
ON public.software
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND (is_admin = true OR is_uploader = true)
  )
);

CREATE POLICY "Admins and uploaders can delete software"
ON public.software
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND (is_admin = true OR is_uploader = true)
  )
);

-- ======================================
-- TABLE: music_content
-- ======================================

-- Supprimer les anciennes politiques admin uniquement
DROP POLICY IF EXISTS "Admins can insert music content" ON public.music_content;
DROP POLICY IF EXISTS "Admins can update music content" ON public.music_content;
DROP POLICY IF EXISTS "Admins can delete music content" ON public.music_content;

-- Créer les nouvelles politiques pour admins ET uploaders
CREATE POLICY "Admins and uploaders can insert music content"
ON public.music_content
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND (is_admin = true OR is_uploader = true)
  )
);

CREATE POLICY "Admins and uploaders can update music content"
ON public.music_content
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND (is_admin = true OR is_uploader = true)
  )
);

CREATE POLICY "Admins and uploaders can delete music content"
ON public.music_content
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND (is_admin = true OR is_uploader = true)
  )
);

-- Afficher un message de confirmation
DO $$
BEGIN
  RAISE NOTICE 'Politiques RLS mises à jour avec succès pour permettre aux uploaders de gérer le contenu';
END $$;
