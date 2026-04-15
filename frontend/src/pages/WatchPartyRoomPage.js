import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import API, { TMDB_IMG } from '../lib/api';
import { ArrowLeft, Users, Play, Pause, Copy, Send, Crown, Shield, LogOut, Trash2, Film, Clapperboard, Radio } from 'lucide-react';

function timeAgo(dateStr) {
  const now = new Date();
  const d = new Date(dateStr);
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "A l'instant";
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}j`;
}

function StatusIndicator({ status }) {
  const config = {
    waiting: { color: '#f59e0b', label: 'En attente' },
    playing: { color: '#10b981', label: 'En lecture' },
    paused: { color: '#0ea5e9', label: 'En pause' },
    ended: { color: '#71717a', label: 'Terminee' },
  };
  const c = config[status] || config.waiting;
  return (
    <span className="flex items-center gap-1 text-xs" data-testid="party-status">
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color, boxShadow: status === 'playing' ? `0 0 6px ${c.color}` : 'none' }} />
      {c.label}
    </span>
  );
}

function ChatBubble({ msg, isMe }) {
  if (msg.type === 'system') {
    return (
      <div className="text-center py-1">
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'hsl(var(--muted) / 0.5)', color: 'hsl(var(--muted-foreground))' }}>
          {msg.message}
        </span>
      </div>
    );
  }
  return (
    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`} data-testid="chat-message">
      <div className="flex items-center gap-1 mb-0.5">
        <span className="text-xs font-medium" style={{ color: isMe ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}>
          {msg.username}
        </span>
        {msg.is_admin && <Shield className="w-3 h-3 text-red-400" />}
        {msg.is_vip && <Crown className="w-3 h-3 text-yellow-400" />}
        <span className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>{timeAgo(msg.timestamp)}</span>
      </div>
      <div className="max-w-[85%] px-3 py-1.5 text-sm"
        style={{
          backgroundColor: isMe ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
          color: isMe ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
          borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        }}>
        {msg.message}
      </div>
    </div>
  );
}

export default function WatchPartyRoomPage() {
  const { id: partyId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [party, setParty] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [contentDetails, setContentDetails] = useState(null);
  const chatEndRef = useRef(null);
  const lastTimestamp = useRef('');

  const fetchParty = useCallback(async () => {
    try {
      const { data } = await API.get(`/api/watch-party/${partyId}`);
      setParty(data.party);
      setMessages(data.party.messages || []);
    } catch {
      toast({ title: 'Erreur', description: 'Soiree introuvable', variant: 'destructive' });
      navigate('/watch-party');
    }
    setLoading(false);
  }, [partyId, navigate, toast]);

  const pollMessages = useCallback(async () => {
    if (!party) return;
    try {
      const since = lastTimestamp.current || '';
      const url = since ? `/api/watch-party/${partyId}/messages?since=${encodeURIComponent(since)}` : `/api/watch-party/${partyId}/messages`;
      const { data } = await API.get(url);
      if (data.messages && data.messages.length > 0) {
        setMessages(prev => {
          const existing = new Set(prev.map(m => m.timestamp + m.message));
          const newMsgs = data.messages.filter(m => !existing.has(m.timestamp + m.message));
          return [...prev, ...newMsgs];
        });
        lastTimestamp.current = data.messages[data.messages.length - 1].timestamp;
      }
      if (party && data.status !== party.status) {
        setParty(p => p ? { ...p, status: data.status, current_time: data.current_time } : p);
      }
    } catch {}
  }, [party, partyId]);

  const fetchContentDetails = useCallback(async () => {
    if (!party) return;
    try {
      const endpoint = party.content_type === 'movie' ? `/api/tmdb/movie/${party.content_id}` : `/api/tmdb/tv/${party.content_id}`;
      const { data } = await API.get(endpoint);
      setContentDetails(data);
    } catch {}
  }, [party?.content_id, party?.content_type]);

  useEffect(() => { fetchParty(); }, [fetchParty]);
  useEffect(() => { if (party) fetchContentDetails(); }, [party?.content_id, fetchContentDetails]);
  useEffect(() => {
    if (!party) return;
    const interval = setInterval(pollMessages, 3000);
    return () => clearInterval(interval);
  }, [party, pollMessages]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);
    try {
      const { data } = await API.post(`/api/watch-party/${partyId}/message`, { message: newMessage.trim() });
      if (data.message) {
        setMessages(prev => [...prev, data.message]);
        lastTimestamp.current = data.message.timestamp;
      }
      setNewMessage('');
    } catch {}
    setSending(false);
  };

  const updateStatus = async (newStatus) => {
    try {
      await API.put(`/api/watch-party/${partyId}/status`, { status: newStatus });
      setParty(p => p ? { ...p, status: newStatus } : p);
    } catch {}
  };

  const leaveParty = async () => {
    try { await API.post(`/api/watch-party/${partyId}/leave`); } catch {}
    navigate('/watch-party');
  };

  const endParty = async () => {
    try { await API.delete(`/api/watch-party/${partyId}`); } catch {}
    navigate('/watch-party');
  };

  const copyCode = () => {
    if (party) {
      navigator.clipboard.writeText(party.room_code);
      toast({ title: 'Code copie !', description: party.room_code });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--background))' }}>
        <div className="text-center">
          <Clapperboard className="w-12 h-12 mx-auto mb-4 animate-pulse" style={{ color: 'hsl(var(--primary))' }} />
          <p style={{ color: 'hsl(var(--muted-foreground))' }}>Chargement de la soiree...</p>
        </div>
      </div>
    );
  }

  if (!party) return null;

  const isHost = user?._id === party.host_id;
  const isEnded = party.status === 'ended';

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <div className="container mx-auto px-4 py-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <Link to="/watch-party" className="p-2 rounded-lg hover:opacity-80 transition-opacity" style={{ color: 'hsl(var(--foreground))' }}>
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg md:text-xl font-bold" style={{ color: 'hsl(var(--foreground))' }} data-testid="party-title">{party.title}</h1>
              <div className="flex items-center gap-2 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                <StatusIndicator status={party.status} />
                <span>Hote: {party.host_username}</span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {party.guests.length + 1}/{party.max_guests}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={copyCode} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-mono border transition-colors"
              style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))', backgroundColor: 'hsl(var(--card))' }}
              data-testid="copy-room-code">
              <Copy className="w-3.5 h-3.5" />{party.room_code}
            </button>
            {!isHost && !isEnded && (
              <button onClick={leaveParty} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border transition-colors"
                style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} data-testid="leave-party-btn">
                <LogOut className="w-4 h-4" />Quitter
              </button>
            )}
            {isHost && !isEnded && (
              <button onClick={endParty} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-red-600 text-white hover:bg-red-700 transition-colors" data-testid="end-party-btn">
                <Trash2 className="w-4 h-4" />Terminer
              </button>
            )}
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Content Area */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl overflow-hidden border" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
              <div className="relative aspect-video" style={{ backgroundColor: '#000' }}>
                {party.poster_path ? (
                  <img src={`${TMDB_IMG}/w1280${party.poster_path}`} alt={party.content_title}
                    className="w-full h-full object-cover"
                    style={{ filter: party.status === 'paused' ? 'brightness(0.5)' : 'brightness(0.7)' }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                    <Film className="w-24 h-24" style={{ color: 'hsl(var(--muted-foreground))' }} />
                  </div>
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  {party.status === 'waiting' && (
                    <div className="text-center px-6 py-4 rounded-xl" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
                      <Radio className="w-8 h-8 text-amber-400 mx-auto mb-2 animate-pulse" />
                      <p className="text-white text-lg font-semibold">En attente du lancement...</p>
                      <p className="text-white/60 text-sm mt-1">L'hote va bientot lancer la lecture</p>
                    </div>
                  )}
                  {party.status === 'paused' && (
                    <div className="text-center px-6 py-4 rounded-xl" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
                      <Pause className="w-10 h-10 text-sky-400 mx-auto mb-2" />
                      <p className="text-white text-lg font-semibold">En pause</p>
                    </div>
                  )}
                  {party.status === 'playing' && (
                    <div className="text-center px-4 py-2 rounded-xl" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                      <p className="text-white/80 text-sm">Visionnage en cours</p>
                      <p className="text-white text-xl font-bold">{party.content_title}</p>
                    </div>
                  )}
                  {isEnded && (
                    <div className="text-center px-6 py-4 rounded-xl" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
                      <Clapperboard className="w-10 h-10 text-zinc-400 mx-auto mb-2" />
                      <p className="text-white text-lg font-semibold">Soiree terminee</p>
                      <p className="text-white/60 text-sm mt-1">Merci d'avoir participe !</p>
                    </div>
                  )}
                </div>
              </div>
              {isHost && !isEnded && (
                <div className="flex items-center justify-center gap-3 p-3" style={{ backgroundColor: 'hsl(var(--card))' }}>
                  {party.status === 'waiting' && (
                    <button onClick={() => updateStatus('playing')} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors" data-testid="play-btn">
                      <Play className="w-4 h-4" />Lancer la lecture
                    </button>
                  )}
                  {party.status === 'playing' && (
                    <button onClick={() => updateStatus('paused')} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-700 transition-colors" data-testid="pause-btn">
                      <Pause className="w-4 h-4" />Pause
                    </button>
                  )}
                  {party.status === 'paused' && (
                    <button onClick={() => updateStatus('playing')} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors" data-testid="resume-btn">
                      <Play className="w-4 h-4" />Reprendre
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Content Info */}
            {contentDetails && (
              <div className="rounded-xl border p-4" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                <div className="flex gap-4">
                  {party.poster_path && (
                    <img src={`${TMDB_IMG}/w185${party.poster_path}`} alt={party.content_title} className="w-20 h-28 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base mb-1" style={{ color: 'hsl(var(--foreground))' }}>{contentDetails.title || contentDetails.name}</h3>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-xs border" style={{ borderColor: 'hsl(var(--primary))', color: 'hsl(var(--primary))' }}>
                        {party.content_type === 'movie' ? 'Film' : 'Serie'}
                      </span>
                      {contentDetails.vote_average && (
                        <span className="px-2 py-0.5 rounded text-xs bg-amber-600/80 text-amber-100">{contentDetails.vote_average.toFixed(1)}</span>
                      )}
                      <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {(contentDetails.release_date || contentDetails.first_air_date || '').slice(0, 4)}
                      </span>
                    </div>
                    <p className="text-sm line-clamp-2" style={{ color: 'hsl(var(--muted-foreground))' }}>{contentDetails.overview}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: Guests + Chat */}
          <div className="space-y-4">
            {/* Guest List */}
            <div className="rounded-xl border p-4" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}>
                <Users className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />Participants ({party.guests.length + 1})
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: 'hsl(var(--primary) / 0.1)' }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                    {party.host_username.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-sm font-medium flex-1 truncate" style={{ color: 'hsl(var(--foreground))' }}>{party.host_username}</p>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-amber-600/80 text-amber-100">Hote</span>
                </div>
                {party.guests.map(guest => (
                  <div key={guest.user_id} className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: 'hsl(var(--muted) / 0.3)' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
                      {guest.username.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-sm truncate flex-1" style={{ color: 'hsl(var(--foreground))' }}>{guest.username}</p>
                    {guest.is_admin && <Shield className="w-3.5 h-3.5 text-red-400" />}
                    {guest.is_vip && <Crown className="w-3.5 h-3.5 text-yellow-400" />}
                  </div>
                ))}
                {party.guests.length === 0 && (
                  <p className="text-xs text-center py-2" style={{ color: 'hsl(var(--muted-foreground))' }}>En attente d'invites...</p>
                )}
              </div>
            </div>

            {/* Chat */}
            <div className="rounded-xl border flex flex-col" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', height: 'calc(100vh - 380px)', minHeight: '350px' }}>
              <div className="p-3 border-b flex items-center gap-2" style={{ borderColor: 'hsl(var(--border))' }}>
                <h3 className="font-semibold text-sm" style={{ color: 'hsl(var(--foreground))' }}>Chat</h3>
                <span className="px-1.5 py-0.5 rounded text-xs border" style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>{messages.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {messages.map((msg, idx) => (
                  <ChatBubble key={idx} msg={msg} isMe={msg.user_id === user?._id} />
                ))}
                <div ref={chatEndRef} />
              </div>
              {user && !isEnded && (
                <div className="p-3 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
                  <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
                    <input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Envoyer un message..." maxLength={500}
                      className="flex-1 h-9 px-3 rounded-lg border outline-none text-sm"
                      style={{ backgroundColor: 'hsl(var(--input))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                      data-testid="chat-input" />
                    <button type="submit" disabled={sending || !newMessage.trim()}
                      className="h-9 px-3 rounded-lg transition-colors disabled:opacity-50"
                      style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                      data-testid="send-message-btn">
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
