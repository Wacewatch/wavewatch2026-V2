-- Insertion des items déblocables par niveau
INSERT INTO interactive_unlockable_items (item_code, name, description, category, unlock_level, item_value) VALUES
  -- Accessoires (Niveaux 1-10)
  ('acc_hat', 'Chapeau Noir', 'Un chapeau classique et élégant', 'accessory', 2, 'hat'),
  ('acc_glasses', 'Lunettes', 'Des lunettes transparentes', 'accessory', 3, 'glasses'),
  ('acc_cap', 'Casquette Rouge', 'Une casquette sportive', 'accessory', 5, 'cap'),
  ('acc_sunglasses', 'Lunettes de Soleil', 'Pour avoir la classe', 'accessory', 7, 'sunglasses'),
  ('acc_headphones', 'Casque Audio', 'Pour écouter de la musique', 'accessory', 10, 'headphones'),
  
  -- Coiffures spéciales (Niveaux 5-15)
  ('hair_mohawk', 'Crête Mohawk', 'Style punk rock', 'hair_style', 8, 'mohawk'),
  ('hair_afro', 'Afro', 'Coiffure volumineuse', 'hair_style', 12, 'afro'),
  ('hair_ponytail', 'Queue de Cheval', 'Coiffure pratique', 'hair_style', 15, 'ponytail'),
  
  -- Couleurs de peau spéciales (Niveaux 10-20)
  ('skin_rainbow', 'Peau Arc-en-ciel', 'Changez de couleur', 'skin_tone', 18, '#FF6B9D'),
  ('skin_alien', 'Peau Alien', 'Peau verte extraterrestre', 'skin_tone', 20, '#00FF00'),
  
  -- Couleurs de corps premium (Niveaux 5-25)
  ('body_gold', 'Corps Doré', 'Brillez de mille feux', 'body_color', 15, '#FFD700'),
  ('body_silver', 'Corps Argenté', 'Élégance métallique', 'body_color', 18, '#C0C0C0'),
  ('body_rainbow', 'Corps Arc-en-ciel', 'Toutes les couleurs', 'body_color', 25, '#FF00FF'),
  
  -- Accessoires premium (Niveaux 15-30)
  ('acc_neon_visor', 'Visière Néon', 'Accessoire futuriste', 'accessory', 20, 'neon_visor'),
  ('acc_hologram', 'Hologramme', 'Projection 3D au-dessus de la tête', 'accessory', 25, 'hologram'),
  ('acc_staff_badge', 'Badge Staff', 'Badge bleu du staff', 'accessory', 30, 'staff_badge'),
  
  -- Émotes (Niveaux 5-40)
  ('emote_dance', 'Danse', 'Bougez sur la musique', 'emote', 5, 'dance'),
  ('emote_wave', 'Salut', 'Faites un signe de la main', 'emote', 8, 'wave'),
  ('emote_jump', 'Saut de Joie', 'Sautez très haut', 'emote', 12, 'jump'),
  ('emote_flip', 'Salto', 'Faites un salto arrière', 'emote', 20, 'flip'),
  ('emote_firework', 'Feu d''Artifice', 'Explosion de feu d''artifice', 'emote', 30, 'firework'),
  ('emote_sparkles', 'Paillettes', 'Entouré de paillettes', 'emote', 35, 'sparkles'),
  ('emote_teleport', 'Téléportation', 'Effet de téléportation', 'emote', 40, 'teleport'),
  
  -- Items légendaires (Niveaux 40-50)
  ('acc_vip_badge', 'Badge VIP', 'Badge doré VIP', 'accessory', 40, 'vip_badge'),
  ('acc_wings', 'Ailes', 'Ailes d''ange dans le dos', 'accessory', 45, 'wings'),
  ('acc_halo', 'Auréole', 'Auréole lumineuse', 'accessory', 48, 'halo'),
  ('acc_legendary_crown', 'Couronne Légendaire', 'Couronne de niveau 50', 'accessory', 50, 'legendary_crown')
ON CONFLICT (item_code) DO NOTHING;
