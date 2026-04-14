import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import API from '../lib/api';
import { Crown, Sparkles, Clock, Trophy } from 'lucide-react';

export default function VIPGamePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState({ played_today: false, won: false });
  const [winners, setWinners] = useState([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (user) { API.get('/api/vip-game/status').then(({ data }) => setStatus(data)).catch(() => {}); }
    API.get('/api/vip-game/winners').then(({ data }) => setWinners(data.winners || [])).catch(() => {});
  }, [user]);

  const playGame = async () => {
    if (!user) { toast({ title: 'Connexion requise', variant: 'destructive' }); return; }
    if (status.played_today) { toast({ title: 'Deja joue aujourd\'hui', variant: 'destructive' }); return; }
    setIsSpinning(true); setResult(null);
    setRotation(prev => prev + 1800 + Math.random() * 360);
    try {
      const { data } = await API.post('/api/vip-game/play');
      setTimeout(() => {
        setIsSpinning(false); setResult(data);
        setStatus({ played_today: true, won: data.won });
        if (data.won) toast({ title: 'Felicitations !', description: data.message });
        else toast({ title: 'Dommage !', description: data.message });
        API.get('/api/vip-game/winners').then(({ data: w }) => setWinners(w.winners || [])).catch(() => {});
      }, 3000);
    } catch (e) { setIsSpinning(false); toast({ title: 'Erreur', description: e.response?.data?.detail || 'Erreur', variant: 'destructive' }); }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl" data-testid="vip-game-page">
      <div className="bg-gradient-to-br from-purple-900/50 via-pink-900/50 to-orange-900/50 border border-purple-700 rounded-2xl p-8">
        <div className="text-center mb-8">
          <Sparkles className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
          <h1 className="text-3xl font-bold mb-2">Jeu VIP Gratuit</h1>
          <p className="text-lg text-muted-foreground">Tentez de gagner un statut VIP gratuit !</p>
        </div>
        {/* Wheel */}
        <div className="relative w-64 h-64 mx-auto mb-8">
          <div className={`w-full h-full rounded-full border-8 border-yellow-400 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600 flex items-center justify-center transition-transform duration-[3000ms] ease-out`}
            style={{ transform: `rotate(${rotation}deg)` }}>
            <Crown className="w-24 h-24 text-yellow-300" />
          </div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-0 h-0 border-l-8 border-r-8 border-t-[16px] border-l-transparent border-r-transparent border-t-yellow-400" />
        </div>
        {result && (
          <div className="text-center mb-6">
            <span className={`text-lg px-4 py-2 rounded-full ${result.won ? 'bg-purple-600 text-white' : 'bg-gray-600 text-gray-200'}`}>
              {result.won ? 'VIP gagne !' : 'Pas de chance'}
            </span>
          </div>
        )}
        {!user ? (
          <div className="text-center"><p className="text-yellow-400 mb-3">Connectez-vous pour jouer !</p></div>
        ) : (
          <button onClick={playGame} disabled={status.played_today || isSpinning}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-lg disabled:opacity-50 transition-all">
            {status.played_today ? 'Revenez demain !' : isSpinning ? 'En cours...' : 'Jouer !'}
          </button>
        )}
        {winners.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4"><Trophy className="w-5 h-5 text-yellow-400" />Derniers gagnants</h2>
            <div className="space-y-2">
              {winners.map((w, i) => (
                <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                  <div className="flex items-center gap-2"><Crown className="w-4 h-4 text-yellow-400" /><span className="font-medium">{w.username}</span></div>
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
