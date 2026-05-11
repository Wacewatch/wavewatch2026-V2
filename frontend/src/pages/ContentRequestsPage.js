import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import API, { TMDB_IMG } from '../lib/api';
import { MessageSquare, ThumbsUp, Plus, Search, Film, Tv, Download, Play, X, Calendar, User as UserIcon, CheckCircle2, XCircle, Clock } from 'lucide-react';

const STATUS_BADGES = {
  pending: { label: 'En attente', cls: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40', icon: Clock },
  approved: { label: 'Approuvé', cls: 'bg-green-500/20 text-green-300 border-green-500/40', icon: CheckCircle2 },
  rejected: { label: 'Rejeté', cls: 'bg-red-500/20 text-red-300 border-red-500/40', icon: XCircle },
};

function TMDBSearchPicker({ onSelect, contentType, setContentType }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const ep = contentType === 'movie' ? '/api/tmdb/search/movies' : '/api/tmdb/search/tv';
        const { data } = await API.get(`${ep}?q=${encodeURIComponent(query)}`);
        setResults((data.results || []).slice(0, 12));
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(timerRef.current);
  }, [query, contentType]);

  return (
    <div className="space-y-3">
      {/* Type toggle */}
      <div className="flex gap-2 p-1 rounded-xl bg-secondary/40 border border-border w-fit">
        <button
          type="button"
          onClick={() => setContentType('movie')}
          className={`px-4 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-all ${contentType === 'movie' ? 'bg-blue-500 text-white shadow-md' : 'text-foreground/70 hover:text-foreground'}`}
          data-testid="request-type-movie"
        >
          <Film className="w-4 h-4" /> Film
        </button>
        <button
          type="button"
          onClick={() => setContentType('tv')}
          className={`px-4 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-all ${contentType === 'tv' ? 'bg-emerald-500 text-white shadow-md' : 'text-foreground/70 hover:text-foreground'}`}
          data-testid="request-type-tv"
        >
          <Tv className="w-4 h-4" /> Série
        </button>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={contentType === 'movie' ? 'Recherche un film sur TMDB…' : 'Recherche une série sur TMDB…'}
          className="w-full pl-10 pr-3 py-3 rounded-xl border border-input bg-background outline-none text-sm focus:border-primary transition-colors"
          autoFocus
          data-testid="request-tmdb-search-input"
        />
      </div>

      {loading && <p className="text-sm text-muted-foreground py-3 text-center">Recherche…</p>}

      {!loading && results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-[500px] overflow-y-auto pr-1">
          {results.map(item => {
            const title = item.title || item.name;
            const year = (item.release_date || item.first_air_date || '').slice(0, 4);
            const img = item.poster_path ? `${TMDB_IMG}/w300${item.poster_path}` : 'https://placehold.co/300x450/1a1a2e/555?text=No+Image';
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect({
                  tmdb_id: item.id,
                  title,
                  poster_path: item.poster_path || '',
                  release_year: year,
                })}
                className="group text-left rounded-xl overflow-hidden border border-border bg-card hover:border-primary hover:shadow-lg hover:shadow-primary/30 transition-all"
                data-testid={`request-tmdb-result-${item.id}`}
              >
                <div className="aspect-[2/3] bg-secondary overflow-hidden">
                  <img src={img} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                </div>
                <div className="p-2">
                  <p className="text-xs font-semibold line-clamp-2 leading-tight">{title}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{year || '—'}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {!loading && query.trim() && results.length === 0 && (
        <p className="text-sm text-muted-foreground py-6 text-center">Aucun résultat pour "{query}"</p>
      )}
    </div>
  );
}

function RequestForm({ onClose, onSubmitted }) {
  const { toast } = useToast();
  const [step, setStep] = useState('search'); // search | details
  const [contentType, setContentType] = useState('movie');
  const [selected, setSelected] = useState(null);
  const [mediaType, setMediaType] = useState('streaming');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    try {
      await API.post('/api/content-requests', {
        tmdb_id: selected.tmdb_id,
        content_type: contentType,
        media_type: mediaType,
        title: selected.title,
        poster_path: selected.poster_path,
        release_year: selected.release_year,
        description: message,
      });
      toast({ title: 'Demande envoyée ! 🎬' });
      onSubmitted();
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Erreur lors de l\'envoi';
      toast({ title: msg, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto" data-testid="request-modal">
      <div className="w-full max-w-3xl bg-card border-2 border-border rounded-2xl shadow-2xl my-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-xl font-black">Nouvelle demande</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {step === 'search' ? '1. Choisis le film ou la série sur TMDB' : '2. Type de demande et message'}
            </p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-secondary flex items-center justify-center" data-testid="request-close-btn">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {step === 'search' && (
            <TMDBSearchPicker
              contentType={contentType}
              setContentType={setContentType}
              onSelect={(item) => { setSelected(item); setStep('details'); }}
            />
          )}

          {step === 'details' && selected && (
            <form onSubmit={submit} className="space-y-5">
              {/* Selected card */}
              <div className="flex gap-4 p-4 rounded-xl border border-border bg-secondary/30">
                <div className="w-20 sm:w-24 aspect-[2/3] rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                  <img src={selected.poster_path ? `${TMDB_IMG}/w200${selected.poster_path}` : 'https://placehold.co/200x300/1a1a2e/555?text=?'} alt={selected.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{contentType === 'movie' ? 'Film' : 'Série'} • TMDB #{selected.tmdb_id}</p>
                  <h3 className="text-lg font-bold mt-1 leading-tight">{selected.title}</h3>
                  {selected.release_year && <p className="text-sm text-muted-foreground mt-0.5">{selected.release_year}</p>}
                  <button type="button" onClick={() => setStep('search')} className="text-xs text-primary hover:underline mt-2" data-testid="request-change-selection">
                    ← Changer de contenu
                  </button>
                </div>
              </div>

              {/* Media type pills */}
              <div>
                <label className="text-sm font-bold mb-2 block">Type de demande</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMediaType('streaming')}
                    className={`relative p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${mediaType === 'streaming' ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/30' : 'border-border bg-secondary/30 hover:border-blue-500/40'}`}
                    data-testid="request-media-streaming"
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${mediaType === 'streaming' ? 'bg-blue-500 text-white' : 'bg-secondary'}`}>
                      <Play className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold">Streaming</p>
                      <p className="text-xs text-muted-foreground">Visionnage en ligne</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaType('download')}
                    className={`relative p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${mediaType === 'download' ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/30' : 'border-border bg-secondary/30 hover:border-emerald-500/40'}`}
                    data-testid="request-media-download"
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${mediaType === 'download' ? 'bg-emerald-500 text-white' : 'bg-secondary'}`}>
                      <Download className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold">Téléchargement</p>
                      <p className="text-xs text-muted-foreground">Lien de download</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="text-sm font-bold mb-2 block">Message <span className="text-xs font-normal text-muted-foreground">(optionnel)</span></label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Précise ta demande (qualité, langue, version...)"
                  rows={4}
                  maxLength={500}
                  className="w-full px-3 py-2.5 rounded-xl border border-input bg-background outline-none text-sm focus:border-primary transition-colors resize-none"
                  data-testid="request-message-textarea"
                />
                <p className="text-[10px] text-muted-foreground mt-1 text-right">{message.length}/500</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 disabled:opacity-50 transition-all shadow-lg"
                  data-testid="request-submit-btn"
                >
                  {submitting ? 'Envoi…' : 'Envoyer la demande'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-3 rounded-xl border border-border hover:bg-secondary transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ContentRequestsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => { loadRequests(); }, []);
  const loadRequests = () => API.get('/api/content-requests').then(({ data }) => setRequests(data.requests || [])).catch(() => {});

  const vote = async (reqId) => {
    if (!user) { toast({ title: 'Connexion requise', variant: 'destructive' }); return; }
    try {
      await API.post('/api/content-requests/votes', { request_id: reqId });
      toast({ title: 'Vote enregistré 👍' });
      loadRequests();
    } catch { toast({ title: 'Tu as déjà voté', variant: 'destructive' }); }
  };

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);
  const counts = {
    all: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  return (
    <div className="container mx-auto px-4 py-8" data-testid="content-requests-page">
      {/* Hero */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl md:text-4xl font-black flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-primary" />
              Demandes de contenu
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Demande un film ou une série depuis TMDB — streaming ou téléchargement.</p>
          </div>
          {user && (
            <button
              onClick={() => setShowForm(true)}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold flex items-center gap-2 shadow-lg hover:opacity-90 transition-all"
              data-testid="open-request-form-btn"
            >
              <Plus className="w-5 h-5" />Faire une demande
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'Toutes' },
            { id: 'pending', label: 'En attente' },
            { id: 'approved', label: 'Approuvées' },
            { id: 'rejected', label: 'Rejetées' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filter === f.id ? 'bg-primary text-primary-foreground shadow-md' : 'bg-secondary/40 hover:bg-secondary text-foreground/70'}`}
              data-testid={`filter-${f.id}`}
            >
              {f.label} <span className="opacity-60">({counts[f.id]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Aucune demande {filter !== 'all' ? `(${filter})` : 'pour le moment'}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(r => {
            const status = STATUS_BADGES[r.status] || STATUS_BADGES.pending;
            const StatusIcon = status.icon;
            const isMovie = r.content_type === 'movie';
            const isStreaming = r.media_type === 'streaming';
            const poster = r.poster_path ? `${TMDB_IMG}/w200${r.poster_path}` : 'https://placehold.co/200x300/1a1a2e/555?text=?';
            return (
              <div key={r._id} className="flex gap-4 p-4 bg-card border border-border rounded-xl hover:border-primary/40 transition-colors" data-testid={`request-card-${r._id}`}>
                <div className="w-20 sm:w-24 aspect-[2/3] rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                  <img src={poster} alt={r.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="min-w-0">
                      <h3 className="font-bold text-base leading-tight truncate">{r.title}</h3>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${isMovie ? 'bg-blue-500/20 text-blue-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                          {isMovie ? <><Film className="w-2.5 h-2.5 inline mr-1" />Film</> : <><Tv className="w-2.5 h-2.5 inline mr-1" />Série</>}
                        </span>
                        {r.release_year && <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-secondary text-foreground/70">{r.release_year}</span>}
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${isStreaming ? 'border-blue-500/40 bg-blue-500/10 text-blue-300' : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'}`}>
                          {isStreaming ? <><Play className="w-2.5 h-2.5 inline mr-0.5" />Streaming</> : <><Download className="w-2.5 h-2.5 inline mr-0.5" />Téléchargement</>}
                        </span>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${status.cls}`}>
                      <StatusIcon className="w-3 h-3" /> {status.label}
                    </span>
                  </div>
                  {r.description && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{r.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-3 gap-2">
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <UserIcon className="w-3 h-3" /> {r.username || 'Anonyme'}
                      {r.created_at && <span className="ml-1">• {new Date(r.created_at).toLocaleDateString('fr-FR')}</span>}
                    </div>
                    <button
                      onClick={() => vote(r._id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary/60 hover:bg-secondary text-xs font-bold transition-colors"
                      data-testid={`vote-${r._id}`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" /> {r.votes || 0}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && <RequestForm onClose={() => setShowForm(false)} onSubmitted={loadRequests} />}
    </div>
  );
}
