import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import API from '../lib/api';
import { LoadingSpinner } from '../components/Loading';
import { Award, Heart, Film, Play, Tv, Trophy, List, FolderOpen, Crown, Lock } from 'lucide-react';

const iconMap = {
  heart: Heart, film: Film, play: Play, tv: Tv, trophy: Trophy, list: List, folder: FolderOpen, crown: Crown
};

export default function AchievementsPage() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    API.get('/api/user/achievements').then(({ data }) => {
      setAchievements(data.achievements || []);
      setStats(data.stats || {});
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  if (!user) return (
    <div className="container mx-auto px-4 py-16 text-center" data-testid="achievements-page">
      <Award className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
      <h1 className="text-2xl font-bold mb-2">Mes Realisations</h1>
      <p className="text-muted-foreground mb-4">Connectez-vous pour voir vos realisations</p>
      <Link to="/login" className="px-6 py-2 rounded-lg bg-primary text-primary-foreground">Connexion</Link>
    </div>
  );

  if (loading) return <LoadingSpinner />;

  const unlocked = achievements.filter(a => a.unlocked).length;
  const total = achievements.length;
  const progress = total > 0 ? (unlocked / total) * 100 : 0;

  return (
    <div className="container mx-auto px-4 py-8" data-testid="achievements-page">
      <div className="text-center mb-8">
        <Award className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
        <h1 className="text-3xl font-bold mb-2">Mes Realisations</h1>
        <p className="text-muted-foreground">{unlocked}/{total} debloques</p>
        <div className="max-w-md mx-auto mt-4">
          <div className="h-3 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[{ label: 'Favoris', val: stats.favorites || 0, color: 'text-red-400' }, { label: 'Visionnes', val: stats.watched || 0, color: 'text-blue-400' }, { label: 'Playlists', val: stats.playlists || 0, color: 'text-purple-400' }].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 text-center">
            <p className={`text-3xl font-bold ${s.color}`}>{s.val}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {achievements.map(a => {
          const Icon = iconMap[a.icon] || Award;
          return (
            <div key={a.id} className={`bg-card border rounded-xl p-5 text-center transition-all ${a.unlocked ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-border opacity-60'}`} data-testid={`achievement-${a.id}`}>
              <div className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center ${a.unlocked ? 'bg-yellow-500/20 border-2 border-yellow-500/50' : 'bg-secondary border-2 border-border'}`}>
                {a.unlocked ? <Icon className="w-7 h-7 text-yellow-400" /> : <Lock className="w-7 h-7 text-muted-foreground" />}
              </div>
              <h3 className={`font-bold mb-1 ${a.unlocked ? 'text-yellow-400' : ''}`}>{a.name}</h3>
              <p className="text-xs text-muted-foreground">{a.description}</p>
              {a.unlocked && <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded-full bg-yellow-500/20 text-yellow-400">Debloque</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
