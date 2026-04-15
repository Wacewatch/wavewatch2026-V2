import React, { useState, useEffect } from 'react';
import API from '../lib/api';
import { LoadingSpinner } from '../components/Loading';
import { Trophy, Crown, Medal, Star } from 'lucide-react';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get('/api/vip-game/winners').then(({ data }) => setWinners(data.winners || [])).catch(() => {}),
      API.get('/api/leaderboard').then(({ data }) => setLeaderboard(data.leaderboard || [])).catch(() => {})
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const medals = ['text-yellow-400', 'text-gray-300', 'text-orange-400'];

  return (
    <div className="container mx-auto px-4 py-8" data-testid="leaderboard-page">
      <div className="text-center mb-8">
        <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
        <h1 className="text-3xl font-bold mb-2">Classement</h1>
        <p className="text-muted-foreground">Les meilleurs membres de la communaute WaveWatch</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* VIP Game Winners */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border bg-gradient-to-r from-purple-900/30 to-pink-900/30">
            <h2 className="text-xl font-bold flex items-center gap-2"><Crown className="w-5 h-5 text-yellow-400" />Gagnants du Jeu VIP</h2>
            <p className="text-sm text-muted-foreground">Les derniers gagnants du statut VIP gratuit</p>
          </div>
          <div className="divide-y divide-border">
            {winners.length === 0 ? <p className="text-center py-8 text-muted-foreground">Aucun gagnant pour le moment</p> :
              winners.map((w, i) => (
                <div key={i} className="flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${i < 3 ? 'bg-yellow-500/20' : 'bg-secondary'}`}>
                    {i < 3 ? <Medal className={`w-5 h-5 ${medals[i]}`} /> : <span className="text-sm text-muted-foreground">{i + 1}</span>}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium flex items-center gap-2">{w.username}<Crown className="w-3 h-3 text-yellow-400" /></p>
                    <p className="text-xs text-muted-foreground">Gagne le {new Date(w.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        {/* Top Supporters */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border bg-gradient-to-r from-blue-900/30 to-cyan-900/30">
            <h2 className="text-xl font-bold flex items-center gap-2"><Star className="w-5 h-5 text-blue-400" />Top Supporters</h2>
            <p className="text-sm text-muted-foreground">Les membres les plus actifs</p>
          </div>
          <div className="divide-y divide-border">
            {leaderboard.length === 0 ? <p className="text-center py-8 text-muted-foreground">Aucune donnee</p> :
              leaderboard.map((u, i) => (
                <div key={i} className="flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${i < 3 ? 'bg-blue-500/20' : 'bg-secondary'}`}>
                    {i < 3 ? <Medal className={`w-5 h-5 ${medals[i]}`} /> : <span className="text-sm text-muted-foreground">{i + 1}</span>}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium flex items-center gap-2">
                      {u.username}
                      {u.is_vip_plus && <span className="px-1.5 py-0.5 text-[10px] rounded bg-purple-500/20 text-purple-400">VIP+</span>}
                      {u.is_vip && !u.is_vip_plus && <span className="px-1.5 py-0.5 text-[10px] rounded bg-yellow-500/20 text-yellow-400">VIP</span>}
                    </p>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}
