import { useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useSeasonalEvent } from '../lib/seasonal';

/**
 * Auto-applique le thème de l'événement saisonnier actif
 * SI l'utilisateur n'a jamais choisi manuellement un thème.
 * Une fois que l'utilisateur change manuellement (flag ww_theme_user_set),
 * son choix est respecté.
 */
export default function AutoThemeApplier() {
  const { setTheme } = useTheme();
  const { event } = useSeasonalEvent();

  useEffect(() => {
    if (!event || !event.auto_theme) return;
    const userSet = localStorage.getItem('ww_theme_user_set') === '1';
    if (userSet) return;
    setTheme(event.auto_theme);
  }, [event, setTheme]);

  return null;
}
