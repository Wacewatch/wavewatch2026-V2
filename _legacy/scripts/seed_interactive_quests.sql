-- Insertion des quêtes (30-50 quêtes)
INSERT INTO interactive_quests (quest_code, title, description, category, xp_reward, requirement_type, requirement_value, is_repeatable) VALUES
  -- Quêtes de découverte (Exploration)
  ('first_login', 'Première Connexion', 'Connectez-vous au monde interactif pour la première fois', 'exploration', 50, 'first_login', 1, false),
  ('visit_cinema', 'Cinéphile Débutant', 'Visitez le cinéma', 'exploration', 25, 'visit_room', 1, false),
  ('visit_stadium', 'Fan de Foot', 'Visitez le stade de football', 'exploration', 25, 'visit_room', 1, false),
  ('visit_disco', 'Fêtard', 'Visitez la discothèque', 'exploration', 25, 'visit_room', 1, false),
  ('visit_arcade', 'Gamer Rétro', 'Visitez l''arcade', 'exploration', 25, 'visit_room', 1, false),
  ('visit_all_rooms', 'Explorateur Complet', 'Visitez tous les lieux du monde', 'exploration', 150, 'visit_all_rooms', 4, false),
  
  -- Quêtes de temps (Time)
  ('time_5min', 'Visiteur Curieux', 'Passez 5 minutes dans le monde', 'time', 30, 'time_spent', 300, false),
  ('time_15min', 'Habitué', 'Passez 15 minutes dans le monde', 'time', 60, 'time_spent', 900, false),
  ('time_30min', 'Résident', 'Passez 30 minutes dans le monde', 'time', 100, 'time_spent', 1800, false),
  ('time_1hour', 'Citoyen', 'Passez 1 heure dans le monde', 'time', 200, 'time_spent', 3600, false),
  ('time_3hours', 'Vétéran', 'Passez 3 heures dans le monde', 'time', 500, 'time_spent', 10800, false),
  ('time_10hours', 'Légende', 'Passez 10 heures dans le monde', 'time', 1500, 'time_spent', 36000, false),
  
  -- Quêtes sociales (Social)
  ('first_chat', 'Premier Message', 'Envoyez votre premier message dans le chat', 'social', 20, 'chat_messages', 1, false),
  ('chat_10', 'Bavard', 'Envoyez 10 messages dans le chat', 'social', 50, 'chat_messages', 10, false),
  ('chat_50', 'Communicateur', 'Envoyez 50 messages dans le chat', 'social', 150, 'chat_messages', 50, false),
  ('chat_100', 'Influenceur', 'Envoyez 100 messages dans le chat', 'social', 300, 'chat_messages', 100, false),
  ('voice_first', 'Première Voix', 'Rejoignez le chat vocal pour la première fois', 'social', 40, 'voice_chat', 1, false),
  ('voice_10', 'Orateur', 'Utilisez le chat vocal 10 fois', 'social', 100, 'voice_chat', 10, false),
  
  -- Quêtes de cinéma (Events)
  ('cinema_first', 'Première Séance', 'Assistez à votre première séance de cinéma', 'events', 35, 'cinema_sessions', 1, false),
  ('cinema_5', 'Cinéphile', 'Assistez à 5 séances de cinéma', 'events', 100, 'cinema_sessions', 5, false),
  ('cinema_20', 'Critique de Cinéma', 'Assistez à 20 séances de cinéma', 'events', 400, 'cinema_sessions', 20, false),
  ('cinema_marathon', 'Marathon de Films', 'Regardez 3 films en une journée', 'events', 250, 'cinema_sessions', 3, false),
  
  -- Quêtes de stade (Events)
  ('stadium_first', 'Premier Match', 'Assistez à votre premier match au stade', 'events', 35, 'stadium_visits', 1, false),
  ('stadium_5', 'Supporter', 'Assistez à 5 matchs au stade', 'events', 100, 'stadium_visits', 5, false),
  ('stadium_20', 'Ultra', 'Assistez à 20 matchs au stade', 'events', 400, 'stadium_visits', 20, false),
  
  -- Quêtes de discothèque (Events)
  ('disco_first', 'Première Danse', 'Allez danser à la discothèque', 'events', 30, 'disco_visits', 1, false),
  ('disco_dance_10', 'Danseur', 'Dansez 10 fois à la disco', 'events', 80, 'dance', 10, false),
  ('disco_dance_50', 'Pro de la Piste', 'Dansez 50 fois à la disco', 'events', 250, 'dance', 50, false),
  ('disco_party', 'Fêtard Nocturne', 'Passez 1 heure à la discothèque', 'events', 150, 'time_in_disco', 3600, false),
  
  -- Quêtes d''arcade (Events)
  ('arcade_first', 'Premier Jeu', 'Jouez à votre premier jeu d''arcade', 'events', 30, 'arcade_play', 1, false),
  ('arcade_5', 'Joueur Rétro', 'Jouez à 5 jeux d''arcade différents', 'events', 80, 'arcade_play', 5, false),
  ('arcade_master', 'Maître de l''Arcade', 'Jouez à tous les jeux disponibles', 'events', 200, 'arcade_play_all', 1, false),
  
  -- Quêtes de personnalisation (Exploration)
  ('avatar_first', 'Styliste Débutant', 'Personnalisez votre avatar pour la première fois', 'exploration', 25, 'avatar_custom', 1, false),
  ('avatar_10', 'Fashionista', 'Changez votre apparence 10 fois', 'exploration', 80, 'avatar_custom', 10, false),
  ('avatar_all_hair', 'Coiffeur Pro', 'Essayez toutes les coiffures disponibles', 'exploration', 150, 'avatar_try_all_hair', 1, false),
  ('avatar_all_colors', 'Arc-en-ciel', 'Essayez toutes les couleurs de corps', 'exploration', 150, 'avatar_try_all_colors', 1, false),
  
  -- Quêtes quotidiennes/répétables (Time)
  ('daily_visit', 'Visite Quotidienne', 'Connectez-vous au monde aujourd''hui', 'time', 20, 'daily_login', 1, true),
  ('daily_30min', 'Session du Jour', 'Passez 30 minutes dans le monde aujourd''hui', 'time', 40, 'daily_time', 1800, true),
  
  -- Quêtes spéciales (Exploration)
  ('night_owl', 'Oiseau de Nuit', 'Connectez-vous entre 00h et 06h', 'exploration', 80, 'login_night', 1, false),
  ('early_bird', 'Lève-tôt', 'Connectez-vous entre 05h et 08h', 'exploration', 80, 'login_morning', 1, false),
  ('world_tour', 'Tour du Monde', 'Visitez chaque lieu 5 fois', 'exploration', 500, 'visit_each_room_5', 1, false),
  
  -- Quêtes sociales avancées (Social)
  ('meet_10', 'Sociable', 'Rencontrez 10 joueurs différents', 'social', 100, 'meet_players', 10, false),
  ('meet_50', 'Populaire', 'Rencontrez 50 joueurs différents', 'social', 400, 'meet_players', 50, false),
  ('voice_group', 'Animateur de Groupe', 'Utilisez le chat vocal avec au moins 3 autres personnes', 'social', 120, 'voice_group', 1, false),
  
  -- Quêtes de collection (Exploration)
  ('collector_5', 'Collectionneur Débutant', 'Déverrouillez 5 items', 'exploration', 100, 'unlock_items', 5, false),
  ('collector_15', 'Collectionneur Avancé', 'Déverrouillez 15 items', 'exploration', 300, 'unlock_items', 15, false),
  ('collector_all', 'Collectionneur Ultime', 'Déverrouillez tous les items', 'exploration', 1000, 'unlock_all_items', 1, false),
  
  -- Quêtes de niveau (Achievement)
  ('reach_level_5', 'Novice', 'Atteignez le niveau 5', 'exploration', 150, 'reach_level', 5, false),
  ('reach_level_10', 'Expérimenté', 'Atteignez le niveau 10', 'exploration', 300, 'reach_level', 10, false),
  ('reach_level_20', 'Expert', 'Atteignez le niveau 20', 'exploration', 600, 'reach_level', 20, false),
  ('reach_level_50', 'Maître', 'Atteignez le niveau 50', 'exploration', 2000, 'reach_level', 50, false)
ON CONFLICT (quest_code) DO NOTHING;
