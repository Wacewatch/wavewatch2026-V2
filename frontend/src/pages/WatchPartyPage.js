import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import API, { TMDB_IMG } from '../lib/api';
import { Plus, Users, Clock, Search, Film, Tv, Crown, Shield, Copy, Clapperboard } from 'lucide-react';

function timeAgo(dateStr) {
  const now = new Date();
  const d = new Date(dateStr);
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "A l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
  return `Il y a ${Math.floor(diff / 86400)}j`;
}

function StatusBadge({ status }) {
  const config = {
    waiting: { label: 'En attente', cls: 'bg-amber-600/80 text-amber-100' },
    playing: { label: 'En lecture', cls: 'bg-emerald-600/80 text-emerald-100 animate-pulse' },
    paused: { label: 'En pause', cls: 'bg-sky-600/80 text-sky-100' },
    ended: { label: 'Terminee', cls: 'bg-zinc-600/80 text-zinc-300' },
  };
  const c = config[status] || config.waiting;
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.cls}`} data-testid={`status-badge-${status}`}>{c.label}</span>;
}

function PartyCard({ party, userId, onJoin, onCopy }) {
  const isHost = userId === party.host_id;
  return (
    <div
      className="group rounded-xl overflow-hidden border transition-all duration-300 hover:shadow-lg cursor-pointer"
      style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
      onClick={onJoin}
      data-testid={`party-card-${party._id}`}
    >
      <div className="relative h-32 overflow-hidden" style={{ backgroundColor: 'hsl(var(--muted))' }}>
        {party.poster_path ? (
          <img src={`${TMDB_IMG}/w500${party.poster_path}`} alt={party.content_title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            style={{ filter: 'brightness(0.6)' }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Film className="w-12 h-12" style={{ color: 'hsl(var(--muted-foreground))' }} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute top-2 left-2 flex gap-1">
          <StatusBadge status={party.status} />
          {isHost && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-600/80 text-amber-100">Hote</span>}
        </div>
        <div className="absolute top-2 right-2">
          <button onClick={(e) => { e.stopPropagation(); onCopy(party.room_code); }}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-mono"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff' }}
            data-testid={`copy-code-${party.room_code}`}>
            <Copy className="w-3 h-3" />{party.room_code}
          </button>
        </div>
        <div className="absolute bottom-2 left-3">
          <p className="text-white text-sm font-medium truncate max-w-[200px]">{party.content_title}</p>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-base mb-2 truncate" style={{ color: 'hsl(var(--foreground))' }}>{party.title}</h3>
        <div className="flex items-center justify-between text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{party.guest_count}/{party.max_guests}</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{timeAgo(party.created_at)}</span>
          </div>
          <span>{party.host_username}</span>
        </div>
      </div>
    </div>
  );
}

export default function WatchPartyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [parties, setParties] = useState([]);
  const [myHosted, setMyHosted] = useState([]);
  const [myJoined, setMyJoined] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');

  // Create party state
  const [showCreate, setShowCreate] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedContent, setSelectedContent] = useState(null);
  const [isPublic, setIsPublic] = useState(true);
  const [maxGuests, setMaxGuests] = useState(10);
  const [creating, setCreating] = useState(false);

  const fetchParties = async () => {
    try {
      const { data } = await API.get('/api/watch-party');
      setParties(data.parties || []);
    } catch {}
  };

  const fetchMyParties = async () => {
    if (!user) return;
    try {
      const { data } = await API.get('/api/watch-party/my');
      setMyHosted(data.hosted || []);
      setMyJoined(data.joined || []);
    } catch {}
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchParties();
      if (user) await fetchMyParties();
      setLoading(false);
    };
    load();
    const interval = setInterval(() => { fetchParties(); if (user) fetchMyParties(); }, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const { data } = await API.get(`/api/tmdb/search?q=${encodeURIComponent(searchQuery)}`);
      const items = (data.results || []).filter(r => r.media_type === 'movie' || r.media_type === 'tv').slice(0, 8);
      setSearchResults(items);
    } catch {}
  };

  const handleCreate = async () => {
    if (!selectedContent || !createTitle.trim()) {
      toast({ title: 'Erreur', description: 'Choisissez un contenu et donnez un titre', variant: 'destructive' });
      return;
    }
    setCreating(true);
    try {
      const { data } = await API.post('/api/watch-party', {
        title: createTitle,
        content_id: selectedContent.id,
        content_type: selectedContent.media_type,
        content_title: selectedContent.title || selectedContent.name,
        poster_path: selectedContent.poster_path,
        max_guests: maxGuests,
        is_public: isPublic,
      });
      if (data.party) {
        toast({ title: 'Soiree creee !', description: `Code: ${data.party.room_code}` });
        setShowCreate(false);
        setCreateTitle(''); setSelectedContent(null); setSearchQuery(''); setSearchResults([]);
        navigate(`/watch-party/${data.party._id}`);
      }
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de creer la soiree', variant: 'destructive' });
    }
    setCreating(false);
  };

  const handleJoinByCode = async () => {
    if (!joinCode.trim()) return;
    try {
      const { data } = await API.get(`/api/watch-party/${joinCode.trim().toUpperCase()}`);
      if (data.party) {
        await API.post(`/api/watch-party/${data.party._id}/join`);
        navigate(`/watch-party/${data.party._id}`);
      } else {
        toast({ title: 'Introuvable', description: 'Aucune soiree trouvee avec ce code', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Erreur', description: 'Code invalide', variant: 'destructive' });
    }
  };

  const handleJoinParty = async (partyId) => {
    if (!user) { navigate('/login'); return; }
    try {
      await API.post(`/api/watch-party/${partyId}/join`);
      navigate(`/watch-party/${partyId}`);
    } catch {}
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast({ title: 'Code copie !', description: code });
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <div className="container mx-auto px-4 py-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl mb-10 p-8 md:p-12" style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.3), hsl(var(--card) / 0.8))' }}>
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Clapperboard className="w-8 h-8" style={{ color: 'hsl(var(--primary))' }} />
                <h1 className="text-3xl md:text-4xl font-bold" style={{ color: 'hsl(var(--foreground))' }} data-testid="watch-party-title">Soiree Cine</h1>
                <span className="px-2 py-0.5 text-xs font-bold text-white rounded bg-gradient-to-r from-amber-500 to-orange-500">NEW</span>
              </div>
              <p className="text-lg max-w-lg" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Regardez des films et series ensemble en temps reel avec vos amis !
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex gap-2">
                <input placeholder="Code ex: A1B2C3D4" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  className="w-40 uppercase font-mono px-3 py-2 rounded-lg border outline-none"
                  style={{ backgroundColor: 'hsl(var(--input))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                  data-testid="join-code-input" />
                <button onClick={handleJoinByCode} disabled={!user || !joinCode.trim()}
                  className="px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                  style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                  data-testid="join-by-code-btn">
                  Rejoindre
                </button>
              </div>
              {user && (
                <button onClick={() => setShowCreate(true)}
                  className="px-4 py-2 rounded-lg font-medium text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 transition-all flex items-center gap-2"
                  data-testid="create-party-btn">
                  <Plus className="w-4 h-4" />Creer une Soiree
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Create Modal */}
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowCreate(false)}>
            <div className="w-full max-w-lg mx-4 rounded-xl border p-6 space-y-4" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Nouvelle Soiree Cine</h2>
              <div>
                <label className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Titre de la soiree</label>
                <input value={createTitle} onChange={e => setCreateTitle(e.target.value)} placeholder="ex: Soiree Marvel avec les potes"
                  className="w-full px-3 py-2 mt-1 rounded-lg border outline-none"
                  style={{ backgroundColor: 'hsl(var(--input))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                  data-testid="party-title-input" />
              </div>
              <div>
                <label className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Choisir un film ou une serie</label>
                <div className="flex gap-2 mt-1">
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder="Rechercher..." className="flex-1 px-3 py-2 rounded-lg border outline-none"
                    style={{ backgroundColor: 'hsl(var(--input))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                    data-testid="search-content-input" />
                  <button onClick={handleSearch} className="px-3 py-2 rounded-lg border" style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} data-testid="search-content-btn">
                    <Search className="w-4 h-4" />
                  </button>
                </div>
                {searchResults.length > 0 && (
                  <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border" style={{ borderColor: 'hsl(var(--border))' }}>
                    {searchResults.map(r => (
                      <button key={r.id} onClick={() => { setSelectedContent(r); setSearchResults([]); if (!createTitle) setCreateTitle(`Soiree ${r.title || r.name}`); }}
                        className="flex items-center gap-3 w-full p-2 text-left hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: selectedContent?.id === r.id ? 'hsl(var(--primary) / 0.2)' : 'transparent' }}
                        data-testid={`search-result-${r.id}`}>
                        {r.poster_path ? <img src={`${TMDB_IMG}/w92${r.poster_path}`} alt="" className="w-10 h-14 rounded object-cover" /> :
                          <div className="w-10 h-14 rounded flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                            {r.media_type === 'movie' ? <Film className="w-5 h-5" /> : <Tv className="w-5 h-5" />}
                          </div>}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: 'hsl(var(--foreground))' }}>{r.title || r.name}</p>
                          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{r.media_type === 'movie' ? 'Film' : 'Serie'} {(r.release_date || r.first_air_date || '').slice(0, 4)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {selectedContent && (
                  <div className="mt-2 flex items-center gap-3 p-2 rounded-lg" style={{ backgroundColor: 'hsl(var(--primary) / 0.15)' }}>
                    {selectedContent.poster_path && <img src={`${TMDB_IMG}/w92${selectedContent.poster_path}`} alt="" className="w-10 h-14 rounded object-cover" />}
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>{selectedContent.title || selectedContent.name}</p>
                      <p className="text-xs" style={{ color: 'hsl(var(--primary))' }}>Selectionne</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                  Publique
                  <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="rounded" data-testid="public-switch" />
                </label>
                <label className="flex items-center gap-2 text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                  Max invites
                  <input type="number" min={2} max={50} value={maxGuests} onChange={e => setMaxGuests(parseInt(e.target.value) || 10)}
                    className="w-16 px-2 py-1 rounded border text-center"
                    style={{ backgroundColor: 'hsl(var(--input))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                    data-testid="max-guests-input" />
                </label>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2 rounded-lg border transition-colors"
                  style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}>Annuler</button>
                <button onClick={handleCreate} disabled={creating || !selectedContent || !createTitle.trim()}
                  className="flex-1 px-4 py-2 rounded-lg font-medium text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 transition-all disabled:opacity-50"
                  data-testid="confirm-create-btn">{creating ? 'Creation...' : 'Lancer la Soiree'}</button>
              </div>
            </div>
          </div>
        )}

        {/* My Parties */}
        {user && (myHosted.length > 0 || myJoined.length > 0) && (
          <div className="mb-10">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}>
              <Clapperboard className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />Mes Soirees
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...myHosted, ...myJoined].map(party => (
                <PartyCard key={party._id} party={party} userId={user?._id} onJoin={() => navigate(`/watch-party/${party._id}`)} onCopy={copyCode} />
              ))}
            </div>
          </div>
        )}

        {/* Public Parties */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}>
            <Users className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />Soirees Publiques
          </h2>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-xl border p-6" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                  <div className="h-40 rounded animate-pulse" style={{ backgroundColor: 'hsl(var(--muted))' }} />
                </div>
              ))}
            </div>
          ) : parties.length === 0 ? (
            <div className="rounded-xl border py-12 text-center" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
              <Clapperboard className="w-16 h-16 mx-auto mb-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
              <p className="text-lg font-medium mb-2" style={{ color: 'hsl(var(--foreground))' }}>Aucune soiree en cours</p>
              <p style={{ color: 'hsl(var(--muted-foreground))' }}>Soyez le premier a en creer une !</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {parties.map(party => (
                <PartyCard key={party._id} party={party} userId={user?._id} onJoin={() => handleJoinParty(party._id)} onCopy={copyCode} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
