-- Script pour créer les profils manquants des utilisateurs
-- Ce script insère un profil pour chaque utilisateur dans auth.users qui n'a pas encore de profil

-- Utilise au.id pour la colonne id au lieu de gen_random_uuid() pour respecter la contrainte de clé étrangère
INSERT INTO public.user_profiles (
  id,
  user_id,
  username,
  email,
  created_at,
  updated_at,
  is_admin,
  is_vip,
  is_vip_plus,
  is_uploader,
  is_beta,
  status,
  theme_preference,
  allow_messages,
  hide_adult_content,
  hide_spoilers,
  auto_mark_watched
)
SELECT 
  au.id as id,  -- Utilise l'ID de auth.users directement
  au.id as user_id,
  -- Génère un username unique basé sur l'UUID de l'utilisateur pour éviter toute collision
  'user_' || REPLACE(au.id::text, '-', '') as username,
  au.email,
  au.created_at,
  NOW() as updated_at,
  false as is_admin,
  false as is_vip,
  false as is_vip_plus,
  false as is_uploader,
  false as is_beta,
  'active' as status,
  'system' as theme_preference,
  true as allow_messages,
  false as hide_adult_content,
  false as hide_spoilers,
  true as auto_mark_watched
FROM auth.users au
-- Vérifie à la fois user_id ET email pour éviter les doublons
LEFT JOIN public.user_profiles up ON au.id = up.user_id
LEFT JOIN public.user_profiles up2 ON au.email = up2.email
WHERE up.user_id IS NULL
AND up2.email IS NULL
AND au.deleted_at IS NULL
AND au.email IS NOT NULL;

-- Afficher le nombre de profils créés
DO $$
DECLARE
  profiles_created INT;
BEGIN
  GET DIAGNOSTICS profiles_created = ROW_COUNT;
  RAISE NOTICE '✓ % profil(s) manquant(s) créé(s) avec succès', profiles_created;
END $$;
