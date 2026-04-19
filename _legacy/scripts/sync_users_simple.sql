-- Script simple et robuste pour synchroniser les utilisateurs manquants
-- entre auth.users et user_profiles

-- 1. Créer le trigger pour les nouvelles inscriptions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INTEGER := 0;
BEGIN
  -- Générer un username unique
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1),
    'user'
  );
  final_username := base_username;
  
  -- Ajouter un suffixe si le username existe
  WHILE EXISTS(SELECT 1 FROM public.user_profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || counter;
  END LOOP;

  -- Créer le profil
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
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Ignorer les erreurs silencieusement pour ne pas bloquer l'inscription
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Installer le trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Synchroniser les utilisateurs manquants UN PAR UN avec gestion d'erreurs
DO $$
DECLARE
  auth_user RECORD;
  base_username TEXT;
  final_username TEXT;
  counter INTEGER;
  synced_count INTEGER := 0;
  skipped_count INTEGER := 0;
BEGIN
  -- Pour chaque utilisateur dans auth.users qui n'a pas de profil
  FOR auth_user IN 
    SELECT au.id, au.email, au.created_at, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.user_profiles up ON au.id = up.user_id
    WHERE up.id IS NULL
  LOOP
    BEGIN
      -- Générer un username unique
      base_username := COALESCE(
        auth_user.raw_user_meta_data->>'username',
        split_part(auth_user.email, '@', 1),
        'user'
      );
      final_username := base_username || '_' || substr(md5(auth_user.id::text), 1, 6);
      counter := 0;
      
      -- Vérifier l'unicité
      WHILE EXISTS(SELECT 1 FROM public.user_profiles WHERE username = final_username) LOOP
        counter := counter + 1;
        final_username := base_username || '_' || substr(md5(auth_user.id::text), 1, 6) || counter;
      END LOOP;
      
      -- Insérer le profil
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
        auth_user.id,
        auth_user.email,
        final_username,
        false,
        false,
        false,
        false,
        'active',
        COALESCE(auth_user.created_at::date, CURRENT_DATE),
        auth_user.created_at,
        auth_user.created_at
      );
      
      synced_count := synced_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      -- En cas d'erreur, skip silencieusement et continuer
      skipped_count := skipped_count + 1;
    END;
  END LOOP;
  
  RAISE NOTICE 'Migration terminée: % profils créés, % ignorés', synced_count, skipped_count;
END $$;

-- 4. Créer les préférences manquantes
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_preferences upref WHERE upref.user_id = up.user_id
);

-- 5. Afficher les statistiques finales
DO $$
DECLARE
  total_auth INTEGER;
  total_profiles INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_auth FROM auth.users;
  SELECT COUNT(*) INTO total_profiles FROM public.user_profiles;
  
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Utilisateurs dans auth.users: %', total_auth;
  RAISE NOTICE 'Utilisateurs dans user_profiles: %', total_profiles;
  RAISE NOTICE 'Différence: %', total_auth - total_profiles;
  RAISE NOTICE '===========================================';
END $$;
