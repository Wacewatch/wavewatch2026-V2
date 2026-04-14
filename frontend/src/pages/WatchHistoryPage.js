import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import API, { TMDB_IMG } from '../lib/api';
import { LoadingSpinner } from '../components/Loading';
import { Clock, Film, Tv, Trash2, History } from 'lucide-react';

export default function WatchHistoryPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    API.get('/api/user/history').then(({ data }) => setHistory(data.history || [])).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  if (!user) return (
    <div className="container mx-auto px-4 py-16 text-center" data-testid="watch-history-page">
      <History className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
      <h1 className="text-2xl font-bold mb-2">Historique de visionnage</h1>
      <p className="text-muted-foreground mb-4">Connectez-vous pour voir votre historique</p>
      <Link to="/login" className="px-6 py-2 rounded-lg bg-primary text-primary-foreground">Connexion</Link>
    </div>
  );

  if (loading) return <LoadingSpinner />;

  const filtered = filter === 'all' ? history : history.filter(h => h.content_type === filter);

  const clearHistory = async () => {
    // This would need a backend endpoint - for now just clear locally
    setHistory([]);
  };

  return (
    <div className="container mx-auto px-4 py-8" data-testid="watch-history-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3"><History className="w-8 h-8 text-blue-400" />Historique</h1>
          <p className="text-muted-foreground mt-1">{history.length} element{history.length !== 1 ? 's' : ''} dans votre historique</p>
        </div>
        {history.length > 0 && (
          <button onClick={clearHistory} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm hover:bg-destructive hover:text-destructive-foreground transition-colors" data-testid="clear-history-btn">
            <Trash2 className="w-4 h-4" />Effacer
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-6">
        {[{ val: 'all', label: 'Tout' }, { val: 'movie', label: 'Films' }, { val: 'tv', label: 'Series' }].map(f => (
          <button key={f.val} onClick={() => setFilter(f.val)} className={`px-4 py-2 rounded-full text-sm border transition-colors ${filter === f.val ? 'bg-primary text-primary-foreground' : 'border-border hover:bg-secondary'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Aucun historique pour le moment</p>
          <p className="text-sm text-muted-foreground mt-1">Regardez des films ou series pour les voir apparaitre ici</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item, idx) => (
            <Link key={`${item.content_type}-${item.content_id}-${idx}`} to={`/${item.content_type === 'movie' ? 'movies' : 'tv-shows'}/${item.content_id}`}
              className="flex items-center gap-4 p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-all group">
              <div className="w-16 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                {item.poster_path && <img src={`${TMDB_IMG}/w200${item.poster_path}`} alt={item.title} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {item.content_type === 'movie' ? <Film className="w-4 h-4 text-red-400" /> : <Tv className="w-4 h-4 text-blue-400" />}
                  <span className="text-xs text-muted-foreground">{item.content_type === 'movie' ? 'Film' : 'Serie'}</span>
                </div>
                <h3 className="font-medium truncate group-hover:text-blue-400 transition-colors">{item.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {item.watched_at ? new Date(item.watched_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Date inconnue'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
