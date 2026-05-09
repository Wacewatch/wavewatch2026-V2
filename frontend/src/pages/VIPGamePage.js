import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import API from '../lib/api';
import { Crown, Sparkles, Trophy, Lock } from 'lucide-react';

function formatRemaining(ms) {
  if (ms <= 0) return null;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${s.toString().padStart(2, '0')}s`;
  return `${s}s`;
}

export default function VIPGamePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [config, setConfig] = useState(null);
  const [status, setStatus] = useState({ can_play: true, played_today: false, won: false, next_play_at: null });
  const [winners, setWinners] = useState([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    API.get('/api/vip-game/config').then(({ data }) => setConfig(data)).catch(() => setConfig({ enabled: true, title: 'Jeu VIP Gratuit', subtitle: 'Tentez de gagner un statut VIP gratuit !' }));
    API.get('/api/vip-game/winners').then(({ data }) => setWinners(data.winners || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (user) { API.get('/api/vip-game/status').then(({ data }) => setStatus(data)).catch(() => {}); }
  }, [user]);

  // Tick every second to update countdown
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const remaining = status.next_play_at ? new Date(status.next_play_at).getTime() - now : 0;
  const cooldownText = formatRemaining(remaining);

  const playGame = async () => {
    if (!user) { toast({ title: 'Connexion requise', variant: 'destructive' }); return; }
    if (!status.can_play) { toast({ title: 'Cooldown actif', description: cooldownText ? `Réessayez dans ${cooldownText}` : 'Réessayez plus tard', variant: 'destructive' }); return; }
    setIsSpinning(true); setResult(null);
    setRotation(prev => prev + 1800 + Math.random() * 360);
    try {
      const { data } = await API.post('/api/vip-game/play');
      setTimeout(() => {
        setIsSpinning(false); setResult(data);
        setStatus(s => ({ ...s, can_play: false, played_today: true, won: data.won, next_play_at: data.next_play_at }));
        if (data.won) toast({ title: 'Felicitations !', description: data.message });
        else toast({ title: 'Dommage !', description: data.message });
        API.get('/api/vip-game/winners').then(({ data: w }) => setWinners(w.winners || [])).catch(() => {});
      }, 3000);
    } catch (e) { setIsSpinning(false); toast({ title: 'Erreur', description: e.response?.data?.detail || 'Erreur', variant: 'destructive' }); }
  };

  if (!config) return null;
  if (!config.enabled) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-2xl text-center" data-testid="vip-game-disabled">
        <Lock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h1 className="text-2xl font-bold mb-2">Jeu indisponible</h1>
        <p className="text-muted-foreground">Le jeu VIP est temporairement désactivé. Revenez plus tard !</p>
      </div>
    );
  }

  const segments = Math.max(4, Math.min(24, config.wheel_segments || 8));
  const slice = 360 / segments;
  const c1 = config.primary_color || '#a855f7';
  const c2 = config.secondary_color || '#ec4899';
  // Build conic gradient string with alternating colors
  const stops = Array.from({ length: segments }, (_, i) => {
    const color = i % 2 === 0 ? c1 : c2;
    return `${color} ${i * slice}deg ${(i + 1) * slice}deg`;
  }).join(', ');
  const wheelBackground = `conic-gradient(from 0deg, ${stops})`;

  const rewardLabel = config.reward_type === 'vip_plus' ? 'VIP+' : 'VIP';

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl" data-testid="vip-game-page">
      <div className="bg-gradient-to-br from-purple-900/50 via-pink-900/50 to-orange-900/50 border border-purple-700 rounded-2xl p-8">
        <div className="text-center mb-8">
          <Sparkles className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
          <h1 className="text-3xl font-bold mb-2">{config.title || 'Jeu VIP Gratuit'}</h1>
          <p className="text-lg text-muted-foreground">{config.subtitle || 'Tentez de gagner un statut VIP gratuit !'}</p>
          <p className="text-sm text-yellow-400 mt-2">Récompense: <span className="font-bold">{rewardLabel}</span> pour <span className="font-bold">{config.reward_days || 30} jours</span></p>
        </div>
        {/* Wheel */}
        <div className="relative w-64 h-64 mx-auto mb-8">
          <div className="w-full h-full rounded-full border-8 border-yellow-400 flex items-center justify-center transition-transform duration-[3000ms] ease-out shadow-2xl"
            style={{ transform: `rotate(${rotation}deg)`, background: wheelBackground }}>
            <div className="w-20 h-20 rounded-full bg-black/40 backdrop-blur flex items-center justify-center">
              <Crown className="w-12 h-12 text-yellow-300" />
            </div>
          </div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-0 h-0 border-l-8 border-r-8 border-t-[16px] border-l-transparent border-r-transparent border-t-yellow-400" />
        </div>
        {result && (
          <div className="text-center mb-6">
            <span className={`text-lg px-4 py-2 rounded-full ${result.won ? 'bg-purple-600 text-white' : 'bg-gray-600 text-gray-200'}`}>
              {result.won ? `${rewardLabel} gagné !` : 'Pas de chance'}
            </span>
          </div>
        )}
        {!user ? (
          <div className="text-center"><p className="text-yellow-400 mb-3">Connectez-vous pour jouer !</p></div>
        ) : (
          <button onClick={playGame} disabled={!status.can_play || isSpinning}
            data-testid="vip-game-play-btn"
            className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-lg disabled:opacity-50 transition-all">
            {isSpinning ? 'En cours...' : (!status.can_play && cooldownText ? `Revenez dans ${cooldownText}` : (!status.can_play ? 'Revenez plus tard !' : 'Jouer !'))}
          </button>
        )}
        {winners.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4"><Trophy className="w-5 h-5 text-yellow-400" />Derniers gagnants</h2>
            <div className="space-y-2">
              {winners.map((w, i) => (
                <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg p-3" data-testid={`vip-game-winner-${i}`}>
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-yellow-400" />
                    <span className="font-medium">{w.username}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">{(w.reward_type || 'vip').toUpperCase().replace('_', '+')}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{w.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
