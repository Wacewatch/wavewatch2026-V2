-- Migration pour synchroniser les utilisateurs manquants entre auth.users et user_profiles
-- Ce script crée le trigger automatique et synchronise les 3000 utilisateurs manquants

-- 1. Créer une fonction trigger pour auto-créer les profils lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  username_exists BOOLEAN;
  counter INTEGER := 0;
BEGIN
  -- Generate unique username with fallback to avoid duplicates
  base_username := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
  final_username := base_username;
  
  -- Check if username exists and add suffix if needed
  LOOP
    SELECT EXISTS(SELECT 1 FROM public.user_profiles WHERE username = final_username) INTO username_exists;
    EXIT WHEN NOT username_exists;
    counter := counter + 1;
    final_username := base_username || counter;
  END LOOP;

  INSERT INTO public.user_profiles (
    id,
    user_id,
    email,
    username,
    is_admin,
    is_vip,
    is_vip_plus,
    is_beta,
    status,
    join_date,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    NEW.id,
    NEW.email,
    final_username,
    false,
    false,
    false,
    false,
    'active',
    CURRENT_DATE,
    NEW.created_at,
    NEW.created_at
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Créer le trigger s'il n'existe pas déjà
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Synchroniser les utilisateurs existants qui n'ont pas de profil
-- Using snake_case and user_id column for foreign key
INSERT INTO public.user_profiles (
  id,
  user_id,
  email,
  username,
  is_admin,
  is_vip,
  is_vip_plus,
  is_beta,
  status,
  vip_expires_at,
  join_date,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  au.id,
  au.email,
  -- Generate unique username with random suffix
  COALESCE(
    au.raw_user_meta_data->>'username',
    split_part(au.email, '@', 1) || '_' || substr(md5(random()::text), 1, 6)
  ),
  false,
  false,
  false,
  false,
  'active',
  NULL,
  COALESCE(au.created_at::date, CURRENT_DATE),
  au.created_at,
  au.created_at
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.user_id
WHERE up.id IS NULL
ON CONFLICT (user_id) DO NOTHING
-- Skip rows with duplicate usernames silently
ON CONFLICT (username) DO NOTHING;

-- 4. Créer les préférences par défaut pour les utilisateurs qui n'en ont pas
INSERT INTO public.user_preferences (
  id,
  user_id,
  show_adult_content,
  show_watched_content,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  up.user_id,
  false,
  true,
  NOW(),
  NOW()
FROM public.user_profiles up
LEFT JOIN public.user_preferences upref ON up.user_id = upref.user_id
WHERE upref.id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- 5. Afficher le résultat de la synchronisation
DO $$
DECLARE
  total_auth_users INTEGER;
  total_profile_users INTEGER;
  synced_users INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_auth_users FROM auth.users;
  SELECT COUNT(*) INTO total_profile_users FROM public.user_profiles;
  synced_users := total_auth_users - total_profile_users;
  
  RAISE NOTICE '=== Migration Complete ===';
  RAISE NOTICE 'Total users in auth.users: %', total_auth_users;
  RAISE NOTICE 'Total users in user_profiles: %', total_profile_users;
  IF synced_users > 0 THEN
    RAISE NOTICE 'Successfully synced % missing users!', synced_users;
  ELSE
    RAISE NOTICE 'All users are already synced!';
  END IF;
END $$;
