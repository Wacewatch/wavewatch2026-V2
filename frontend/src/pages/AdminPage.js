import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import API from '../lib/api';
import { Shield, Users, BarChart3, MessageSquare, Settings, Crown, Trash2, Film, Eye, EyeOff, Plus, Edit, Tv, Radio, Music, Monitor, Gamepad2, BookOpen, Save, Search, ChevronLeft, ChevronRight, Send, FileText, X, ExternalLink, UserPlus, Key, Play, Calendar, Sparkles } from 'lucide-react';
import ModuleOrderManager from '../components/ModuleOrderManager';
import { InfoPanelView } from '../components/InfoBanner';
import EventsAdminPanel from '../components/admin/EventsAdminPanel';

const USERS_PER_PAGE = 15;

const ACTIVITY_META = {
  register: { label: 'Inscription', icon: UserPlus, color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' },
  code_redeem: { label: 'Code utilise', icon: Key, color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30' },
  play: { label: 'Lecture', icon: Play, color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/30' },
  admin_action: { label: 'Admin', icon: Shield, color: 'text-blue-400', bg: 'bg-blue-500/15 border-blue-500/30' },
};

function ActivityFeedView({ activities, onRefresh }) {
  const [filter, setFilter] = useState('all');
  const filters = [
    { id: 'all', label: 'Tous', color: 'bg-secondary' },
    { id: 'register', label: 'Inscriptions', color: 'bg-emerald-500/20 text-emerald-300' },
    { id: 'code_redeem', label: 'Codes', color: 'bg-amber-500/20 text-amber-300' },
    { id: 'play', label: 'Lectures', color: 'bg-red-500/20 text-red-300' },
    { id: 'admin_action', label: 'Admin', color: 'bg-blue-500/20 text-blue-300' },
  ];
  const filtered = filter === 'all' ? activities : activities.filter(a => a.type === filter);
  const counts = activities.reduce((acc, a) => { acc[a.type] = (acc[a.type] || 0) + 1; return acc; }, {});

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {['register', 'code_redeem', 'play', 'admin_action'].map(k => {
          const meta = ACTIVITY_META[k];
          const Icon = meta.icon;
          return (
            <div key={k} className={`rounded-xl border p-3 flex items-center gap-3 ${meta.bg}`}>
              <Icon className={`w-5 h-5 ${meta.color}`} />
              <div>
                <p className={`text-lg font-bold ${meta.color}`}>{counts[k] || 0}</p>
                <p className="text-xs text-muted-foreground">{meta.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {filters.map(f => (
          <button key={f.id} type="button" onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === f.id ? 'bg-primary text-primary-foreground' : `${f.color} hover:opacity-80`}`}
            data-testid={`activity-filter-${f.id}`}>
            {f.label}
          </button>
        ))}
        <button type="button" onClick={onRefresh} className="ml-auto px-3 py-1.5 rounded-lg text-xs border border-border hover:bg-secondary">Rafraichir</button>
      </div>

      {/* Feed */}
      {filtered.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">Aucune activite</p>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
          {filtered.map(a => {
            const meta = ACTIVITY_META[a.type] || ACTIVITY_META.admin_action;
            const Icon = meta.icon;
            return (
              <div key={a._id} className="p-4 flex items-start gap-3 hover:bg-secondary/30 transition-colors" data-testid={`activity-${a.type}`}>
                <div className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 ${meta.bg}`}>
                  <Icon className={`w-5 h-5 ${meta.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] uppercase tracking-wider font-bold ${meta.color}`}>{meta.label}</span>
                    {a.username && <span className="font-bold text-sm truncate">{a.username}</span>}
                  </div>
                  <p className="text-sm mt-0.5">{a.details || a.action}</p>
                  {/* Extra details */}
                  {a.type === 'register' && (a.email || a.ip) && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {a.email && <span>{a.email}</span>}
                      {a.ip && <span className="ml-2 opacity-70">IP: {a.ip}</span>}
                    </p>
                  )}
                  {a.type === 'code_redeem' && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Code: <span className="font-mono text-amber-300">{a.code}</span>
                      {a.code_type && <span className="ml-2 uppercase">{a.code_type}</span>}
                      {a.duration_days ? <span className="ml-2">{a.duration_days}j</span> : null}
                    </p>
                  )}
                  {a.type === 'play' && a.title && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {a.content_type && <span className="uppercase mr-2 opacity-70">{a.content_type}</span>}
                      <span className="italic">« {a.title} »</span>
                    </p>
                  )}
                  {a.type === 'admin_action' && a.target && (
                    <p className="text-xs text-muted-foreground mt-0.5">{a.target}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1 opacity-70">{a.created_at ? new Date(a.created_at).toLocaleString('fr-FR') : ''}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ContentForm({ fields, data, setData, onSubmit, onCancel, title }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-card border border-border rounded-xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3">
          {fields.map(f => (
            <div key={f.key}>
              <label className="text-sm font-medium text-muted-foreground">{f.label}</label>
              {f.type === 'textarea' ? (
                <textarea value={data[f.key] || ''} onChange={e => setData(p => ({ ...p, [f.key]: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background outline-none text-sm" rows={3} />
              ) : f.type === 'checkbox' ? (
                <div className="flex items-center gap-2 mt-1"><input type="checkbox" checked={data[f.key] || false} onChange={e => setData(p => ({ ...p, [f.key]: e.target.checked }))} className="w-4 h-4" /><span className="text-sm">{f.label}</span></div>
              ) : (
                <input type={f.type || 'text'} value={data[f.key] || ''} onChange={e => setData(p => ({ ...p, [f.key]: f.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background outline-none text-sm" placeholder={f.placeholder || f.label} />
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onSubmit} className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm"><Save className="w-4 h-4 inline mr-1" />Sauvegarder</button>
          <button onClick={onCancel} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-secondary">Annuler</button>
        </div>
      </div>
    </div>
  );
}

function ContentTable({ items, columns, onEdit, onDelete, onToggle, searchTerm, setSearchTerm, onAdd, addLabel, type }) {
  const filtered = items.filter(item => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return columns.some(c => (item[c.key] || '').toString().toLowerCase().includes(s));
  });

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="font-bold">{addLabel} ({items.length})</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 pr-3 py-1.5 rounded-lg border border-input bg-background text-sm outline-none w-full sm:w-48" />
          </div>
          <button onClick={onAdd} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-1" data-testid={`add-${type}-btn`}><Plus className="w-4 h-4" />Ajouter</button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              {columns.map(c => <th key={c.key} className="px-4 py-2 text-left font-medium text-muted-foreground">{c.label}</th>)}
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={columns.length + 1} className="text-center py-8 text-muted-foreground">Aucun element</td></tr>
            ) : filtered.map(item => (
              <tr key={item._id} className="border-b border-border/50 hover:bg-secondary/20">
                {columns.map(c => (
                  <td key={c.key} className="px-4 py-2">{c.render ? c.render(item) : (item[c.key] || '-')}</td>
                ))}
                <td className="px-4 py-2">
                  <div className="flex gap-1">
                    {onToggle && <button onClick={() => onToggle(item._id)} className={`px-2 py-0.5 rounded text-xs ${item.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{item.is_active ? 'Actif' : 'Inactif'}</button>}
                    <button onClick={() => onEdit(item)} className="p-1 text-muted-foreground hover:text-blue-400"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => onDelete(item._id)} className="p-1 text-muted-foreground hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [modules, setModules] = useState({
    hero: true, trending_movies: true, recommendations: true, trending_tv_shows: true, popular_anime: true,
    popular_collections: true, public_playlists: true, trending_actors: true,
    trending_tv_channels: true, subscription_offer: true, random_content: true,
    football_calendar: true, calendar_widget: true, sports_promo: true, livewatch_promo: true, vip_game_promo: true,
    download_links: true
  });
  const [cinemaRooms, setCinemaRooms] = useState([]);
  const [newRoom, setNewRoom] = useState({ name: '', movie_title: '', date: '', time: '', capacity: 50 });

  // Online users
  const [onlineStats, setOnlineStats] = useState({ online_now: 0, last_hour: 0, last_24h: 0 });
  // Watching-now (live)
  const [watchingNow, setWatchingNow] = useState({ count: 0, watchers: [] });

  // User edit dialog
  const [editingUser, setEditingUser] = useState(null);
  const [userEditForm, setUserEditForm] = useState({});
  const [newPassword, setNewPassword] = useState('');

  // Content states
  const [tvChannels, setTvChannels] = useState([]);
  const [radioStations, setRadioStations] = useState([]);
  const [musicContent, setMusicContent] = useState([]);
  const [softwareItems, setSoftwareItems] = useState([]);
  const [gamesItems, setGamesItems] = useState([]);
  const [ebooksItems, setEbooksItems] = useState([]);
  const [retrogaming, setRetrogaming] = useState([]);
  const [changelogs, setChangelogs] = useState([]);
  const [requests, setRequests] = useState([]);

  // Search terms
  const [searchTerms, setSearchTerms] = useState({});

  // Form/modal states
  const [showForm, setShowForm] = useState(null);
  const [formData, setFormData] = useState({});
  const [editingId, setEditingId] = useState(null);

  // Users pagination
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [userFilter, setUserFilter] = useState('all');

  // Broadcast
  const [broadcastForm, setBroadcastForm] = useState({ subject: '', content: '' });

  // Activity feed
  const [activities, setActivities] = useState([]);

  // TMDB update
  const [tmdbUpdating, setTmdbUpdating] = useState(false);

  // VIP Codes
  const [vipCodes, setVipCodes] = useState([]);
  const [newCodeType, setNewCodeType] = useState('vip');
  const [newCodeDuration, setNewCodeDuration] = useState(30);
  const [newCodeQuantity, setNewCodeQuantity] = useState(1);

  // Info banner
  const [infoBanner, setInfoBanner] = useState({ enabled: false, title: '', subtitle: '', badge: '', message: '', variant: 'info', image_url: '', tags: [], link_url: '', link_label: '', link2_url: '', link2_label: '', footer_text: '', dismissible: true, version: 1 });
  const [tagsInput, setTagsInput] = useState('');

  // Download links module
  const [dlConfig, setDlConfig] = useState({ enabled: true, title: 'Derniers liens de téléchargement', subtitle: 'Les derniers ajouts à la communauté', limit: 12, show_quality_badge: true });
  const [dlStats, setDlStats] = useState({ total: 0, last_24h: 0 });

  // VIP Game configuration
  const [vipGameCfg, setVipGameCfg] = useState({
    enabled: true,
    title: 'Jeu VIP Gratuit',
    subtitle: 'Tentez de gagner un statut VIP gratuit !',
    win_rate: 5.0,
    reward_type: 'vip',
    reward_days: 30,
    play_interval_hours: 24,
    max_winners_per_day: 0,
    winners_visible: 10,
    win_message: 'Felicitations ! Vous avez gagne le VIP pour 30 jours !',
    lose_message: 'Pas de chance, reessayez bientot !',
    wheel_segments: 8,
    primary_color: '#a855f7',
    secondary_color: '#ec4899',
  });
  const [vipGameSaving, setVipGameSaving] = useState(false);

  // Community reviews moderation
  const [reviews, setReviews] = useState([]);
  const [reviewsAvgs, setReviewsAvgs] = useState({ contenu: 0, fonctionnalites: 0, design: 0 });
  const [editingReview, setEditingReview] = useState(null);
  const [reviewForm, setReviewForm] = useState({ message: '', contenu_score: 5, fonctionnalites_score: 5, design_score: 5 });

  useEffect(() => { if (!authLoading && (!user || !user.is_admin)) navigate('/'); }, [user, authLoading, navigate]);

  const loadData = useCallback((currentTab) => {
    if (!user?.is_admin) return;
    const endpoints = {
      stats: () => API.get('/api/admin/enhanced-stats').then(({ data }) => setStats(data)),
      users: () => API.get('/api/admin/users').then(({ data }) => setUsers(data.users || [])),
      messages: () => API.get('/api/staff-messages').then(({ data }) => setMessages(data.messages || [])),
      modules: () => API.get('/api/admin/site-settings/home_modules').then(({ data }) => { if (data.setting_value) setModules(p => ({ ...p, ...data.setting_value })); }),
      cinema: () => API.get('/api/admin/cinema-rooms').then(({ data }) => setCinemaRooms(data.rooms || [])),
      tvchannels: () => API.get('/api/tv-channels').then(({ data }) => setTvChannels(data.channels || [])),
      radio: () => API.get('/api/radio-stations').then(({ data }) => setRadioStations(data.stations || [])),
      music: () => API.get('/api/music').then(({ data }) => setMusicContent(Array.isArray(data) ? data : [])),
      software: () => API.get('/api/software?limit=10000').then(({ data }) => setSoftwareItems(data.software || data.items || (Array.isArray(data) ? data : []))),
      games: () => API.get('/api/games').then(({ data }) => setGamesItems(Array.isArray(data) ? data : [])),
      ebooks: () => API.get('/api/ebooks?limit=10000').then(({ data }) => setEbooksItems(data.ebooks || data.items || (Array.isArray(data) ? data : []))),
      retrogaming: () => API.get('/api/retrogaming').then(({ data }) => setRetrogaming(data.sources || [])),
      changelogs: () => API.get('/api/changelogs').then(({ data }) => setChangelogs(data || [])),
      requests: () => API.get('/api/content-requests').then(({ data }) => setRequests(data.requests || [])),
      activities: () => API.get('/api/admin/activities').then(({ data }) => setActivities(data.activities || [])),
      vipcodes: () => API.get('/api/admin/vip-codes').then(({ data }) => setVipCodes(data.codes || [])),
      info_banner: () => API.get('/api/admin/info-banner').then(({ data }) => { if (data.banner) { setInfoBanner(p => ({ ...p, ...data.banner, tags: data.banner.tags || [] })); setTagsInput((data.banner.tags || []).join(', ')); } }),
      download_links: () => Promise.all([
        API.get('/api/download-links/config').then(({ data }) => { if (data?.config) setDlConfig(p => ({ ...p, ...data.config })); }),
        API.get('/api/admin/download-links/stats').then(({ data }) => setDlStats(data || { total: 0, last_24h: 0 })).catch(() => {}),
      ]),
      vip_game: () => API.get('/api/admin/vip-game/config').then(({ data }) => { if (data?.config) setVipGameCfg(p => ({ ...p, ...data.config })); }),
      reviews: () => API.get('/api/platform-reviews').then(({ data }) => {
        setReviews(data.reviews || []);
        setReviewsAvgs(data.averages || { contenu: 0, fonctionnalites: 0, design: 0 });
      }),
    };
    if (endpoints[currentTab]) endpoints[currentTab]().catch(() => {});
  }, [user]);

  useEffect(() => { if (user?.is_admin) loadData(tab); }, [user, tab, loadData]);

  // Load online stats and refresh periodically
  useEffect(() => {
    if (!user?.is_admin) return;
    const loadLive = () => {
      API.get('/api/admin/online-users').then(({ data }) => setOnlineStats(data)).catch(() => {});
      API.get('/api/admin/watching-now').then(({ data }) => setWatchingNow(data)).catch(() => {});
    };
    loadLive();
    const iv = setInterval(loadLive, 15000);
    return () => clearInterval(iv);
  }, [user]);

  if (authLoading || !user?.is_admin) return null;

  // User edit handlers
  const openUserEdit = (u) => {
    setEditingUser(u);
    setUserEditForm({ username: u.username, email: u.email, is_admin: u.is_admin, is_vip: u.is_vip, is_vip_plus: u.is_vip_plus, is_uploader: u.is_uploader, is_beta: u.is_beta });
    setNewPassword('');
  };

  const saveUserEdit = async () => {
    try {
      const updates = { ...userEditForm };
      if (newPassword.trim()) updates.password = newPassword;
      await API.put(`/api/admin/users/${editingUser._id}`, updates);
      toast({ title: 'Utilisateur mis a jour' });
      setEditingUser(null);
      loadData('users');
    } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
  };

  // ---- CRUD Helpers ----
  const handleAdd = (type, fields) => {
    setEditingId(null);
    const defaults = {};
    fields.forEach(f => { defaults[f.key] = f.default !== undefined ? f.default : ''; });
    setFormData(defaults);
    setShowForm(type);
  };

  const handleEdit = (type, item) => {
    setEditingId(item._id);
    setFormData({ ...item });
    setShowForm(type);
  };

  const handleSubmit = async (type, apiBase) => {
    try {
      // Nettoyer formData pour éviter les doublons - supprimer _id si on crée
      const cleanData = { ...formData };
      if (!editingId) {
        delete cleanData._id;
        delete cleanData.id;
      }
      
      if (editingId) {
        await API.put(`${apiBase}/${editingId}`, cleanData);
        toast({ title: 'Mis a jour avec succes' });
      } else {
        await API.post(apiBase, cleanData);
        toast({ title: 'Ajoute avec succes' });
      }
      setShowForm(null);
      setFormData({});
      loadData(tab);
    } catch (e) { 
      console.error('Submit error:', e);
      toast({ title: 'Erreur', variant: 'destructive' }); 
    }
  };

  const handleDelete = async (apiBase, id, label) => {
    if (!window.confirm(`Supprimer ${label} ?`)) return;
    try { await API.delete(`${apiBase}/${id}`); toast({ title: 'Supprime' }); loadData(tab); }
    catch { toast({ title: 'Erreur', variant: 'destructive' }); }
  };

  const handleToggle = async (apiBase, id, items, setItems) => {
    const item = items.find(i => i._id === id);
    if (!item) return;
    try {
      await API.put(`${apiBase}/${id}`, { is_active: !item.is_active });
      setItems(prev => prev.map(i => i._id === id ? { ...i, is_active: !i.is_active } : i));
      toast({ title: 'Statut modifie' });
    } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
  };

  // User management
  const updateUserRole = async (userId, field, value) => {
    try { await API.put(`/api/admin/users/${userId}`, { [field]: value }); toast({ title: 'Utilisateur mis a jour' }); loadData('users'); }
    catch { toast({ title: 'Erreur', variant: 'destructive' }); }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Supprimer cet utilisateur ?')) return;
    try { await API.delete(`/api/admin/users/${userId}`); toast({ title: 'Utilisateur supprime' }); setUsers(u => u.filter(x => x._id !== userId)); }
    catch { toast({ title: 'Erreur', variant: 'destructive' }); }
  };

  const replyMessage = async (msgId) => {
    const reply = prompt('Votre reponse :');
    if (!reply) return;
    try { await API.post('/api/staff-messages/reply', { message_id: msgId, reply }); toast({ title: 'Reponse envoyee' }); loadData('messages'); }
    catch { toast({ title: 'Erreur', variant: 'destructive' }); }
  };

  const toggleModule = async (key) => {
    const newModules = { ...modules, [key]: !modules[key] };
    setModules(newModules);
    try { await API.put('/api/admin/site-settings', { setting_key: 'home_modules', setting_value: newModules }); toast({ title: 'Module mis a jour' }); }
    catch { toast({ title: 'Erreur', variant: 'destructive' }); }
  };

  const createRoom = async () => {
    if (!newRoom.name || !newRoom.movie_title) return;
    try { await API.post('/api/admin/cinema-rooms', newRoom); toast({ title: 'Salle creee' }); setNewRoom({ name: '', movie_title: '', date: '', time: '', capacity: 50 }); loadData('cinema'); }
    catch { toast({ title: 'Erreur', variant: 'destructive' }); }
  };

  const deleteRoom = async (roomId) => {
    try { await API.delete(`/api/admin/cinema-rooms/${roomId}`); toast({ title: 'Salle supprimee' }); setCinemaRooms(r => r.filter(x => x.room_id !== roomId)); }
    catch { toast({ title: 'Erreur', variant: 'destructive' }); }
  };

  const sendBroadcast = async () => {
    if (!broadcastForm.subject || !broadcastForm.content) { toast({ title: 'Remplissez tous les champs', variant: 'destructive' }); return; }
    try { const { data } = await API.post('/api/admin/broadcast', broadcastForm); toast({ title: data.message || 'Message envoye' }); setBroadcastForm({ subject: '', content: '' }); }
    catch { toast({ title: 'Erreur', variant: 'destructive' }); }
  };

  const updateRequestStatus = async (id, status) => {
    try { await API.put(`/api/admin/content-requests/${id}`, { status }); toast({ title: 'Statut mis a jour' }); loadData('requests'); }
    catch { toast({ title: 'Erreur', variant: 'destructive' }); }
  };

  // Users filtering and pagination
  const filteredUsers = users.filter(u => {
    const matchesSearch = !userSearch || u.username?.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase());
    if (!matchesSearch) return false;
    if (userFilter === 'admin') return u.is_admin;
    if (userFilter === 'vip') return u.is_vip;
    if (userFilter === 'vip_plus') return u.is_vip_plus;
    if (userFilter === 'uploader') return u.is_uploader;
    return true;
  });
  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice((userPage - 1) * USERS_PER_PAGE, userPage * USERS_PER_PAGE);

  // Field definitions
  const tvFields = [{ key: 'name', label: 'Nom' }, { key: 'category', label: 'Categorie' }, { key: 'country', label: 'Pays' }, { key: 'stream_url', label: 'URL du flux' }, { key: 'logo_url', label: 'URL du logo' }, { key: 'description', label: 'Description', type: 'textarea' }, { key: 'quality', label: 'Qualite' }, { key: 'is_active', label: 'Actif', type: 'checkbox' }];
  const radioFields = [{ key: 'name', label: 'Nom' }, { key: 'genre', label: 'Genre' }, { key: 'country', label: 'Pays' }, { key: 'frequency', label: 'Frequence (ex: 91.3 FM)' }, { key: 'stream_url', label: 'URL du flux audio' }, { key: 'website_url', label: 'URL du site officiel' }, { key: 'logo_url', label: 'URL du logo' }, { key: 'description', label: 'Description', type: 'textarea' }, { key: 'is_active', label: 'Actif', type: 'checkbox' }];
  const musicFields = [{ key: 'title', label: 'Titre' }, { key: 'artist', label: 'Artiste' }, { key: 'genre', label: 'Genre' }, { key: 'streaming_url', label: 'URL streaming' }, { key: 'thumbnail_url', label: 'URL miniature' }, { key: 'description', label: 'Description', type: 'textarea' }];
  const softFields = [{ key: 'name', label: 'Nom' }, { key: 'developer', label: 'Developpeur' }, { key: 'category', label: 'Categorie' }, { key: 'platform', label: 'Plateforme' }, { key: 'download_url', label: 'URL telechargement' }, { key: 'icon_url', label: 'URL icone' }, { key: 'description', label: 'Description', type: 'textarea' }];
  const gameFields = [{ key: 'title', label: 'Titre' }, { key: 'developer', label: 'Developpeur' }, { key: 'genre', label: 'Genre' }, { key: 'platform', label: 'Plateforme' }, { key: 'download_url', label: 'URL telechargement' }, { key: 'cover_url', label: 'URL couverture' }, { key: 'description', label: 'Description', type: 'textarea' }];
  const ebookFields = [{ key: 'title', label: 'Titre' }, { key: 'author', label: 'Auteur' }, { key: 'category', label: 'Categorie' }, { key: 'language', label: 'Langue' }, { key: 'download_url', label: 'URL telechargement' }, { key: 'reading_url', label: 'URL lecture' }, { key: 'cover_url', label: 'URL couverture' }, { key: 'description', label: 'Description', type: 'textarea' }];
  const retroFields = [{ key: 'name', label: 'Nom' }, { key: 'url', label: 'URL' }, { key: 'category', label: 'Categorie' }, { key: 'description', label: 'Description', type: 'textarea' }];
  const changelogFields = [{ key: 'version', label: 'Version' }, { key: 'title', label: 'Titre' }, { key: 'release_date', label: 'Date', type: 'date' }, { key: 'description', label: 'Description', type: 'textarea' }];

  const tabs = [
    { id: 'stats', label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'broadcast', label: 'Message', icon: <Send className="w-4 h-4" /> },
    { id: 'tvchannels', label: 'TV', icon: <Tv className="w-4 h-4" />, count: tvChannels.length },
    { id: 'radio', label: 'Radio', icon: <Radio className="w-4 h-4" />, count: radioStations.length },
    { id: 'music', label: 'Musique', icon: <Music className="w-4 h-4" />, count: musicContent.length },
    { id: 'software', label: 'Logiciels', icon: <Monitor className="w-4 h-4" />, count: softwareItems.length },
    { id: 'games', label: 'Jeux', icon: <Gamepad2 className="w-4 h-4" />, count: gamesItems.length },
    { id: 'ebooks', label: 'Ebooks', icon: <BookOpen className="w-4 h-4" />, count: ebooksItems.length },
    { id: 'retrogaming', label: 'Retro', icon: <Gamepad2 className="w-4 h-4" />, count: retrogaming.length },
    { id: 'requests', label: 'Demandes', icon: <MessageSquare className="w-4 h-4" />, count: requests.length },
    { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" />, count: users.length },
    { id: 'messages', label: 'Staff', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'changelogs', label: 'Logs', icon: <FileText className="w-4 h-4" />, count: changelogs.length },
    { id: 'modules', label: 'Modules', icon: <Settings className="w-4 h-4" /> },
    { id: 'cinema', label: 'Cinema', icon: <Film className="w-4 h-4" /> },
    { id: 'activities', label: 'Feed', icon: <Users className="w-4 h-4" /> },
    { id: 'vipcodes', label: 'Codes', icon: <Crown className="w-4 h-4" /> },
    { id: 'info_banner', label: 'Panneau', icon: <Send className="w-4 h-4" /> },
    { id: 'download_links', label: 'Téléchargements', icon: <FileText className="w-4 h-4" /> },
    { id: 'vip_game', label: 'Jeu VIP', icon: <Crown className="w-4 h-4" /> },
    { id: 'reviews', label: 'Avis', icon: <MessageSquare className="w-4 h-4" />, count: reviews.length },
    { id: 'tmdb', label: 'TMDB', icon: <Film className="w-4 h-4" /> },
    { id: 'events', label: 'Événements', icon: <Calendar className="w-4 h-4" /> },
  ];

  const moduleLabels = {
    hero: 'Hero (Carrousel)', trending_movies: 'Films Tendance', recommendations: 'Recommandations',
    trending_tv_shows: 'Series Tendance',
    popular_anime: 'Animes Populaires', popular_collections: 'Collections Populaires',
    public_playlists: 'Playlists Communaute', trending_actors: 'Acteurs Tendance',
    trending_tv_channels: 'Chaines TV', subscription_offer: 'Offre VIP',
    random_content: 'Contenu Aleatoire', football_calendar: 'Calendrier Football',
    calendar_widget: 'Prochaines Sorties', sports_promo: 'Promo Sports', livewatch_promo: 'Promo LiveWatch',
    vip_game_promo: 'Promo Jeu VIP',
    download_links: 'Liens de Téléchargement'
  };

  return (
    <div className="container mx-auto px-4 py-8" data-testid="admin-page">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-3"><Shield className="w-8 h-8 text-red-400" />Administration WaveWatch</h1>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-6 overflow-x-auto pb-2">
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setUserPage(1); }} data-testid={`admin-tab-${t.id}`}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${tab === t.id ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'}`}>
            {t.icon}<span className="hidden sm:inline">{t.label}</span>{t.count !== undefined && <span className="text-[10px] opacity-70">({t.count})</span>}
          </button>
        ))}
      </div>

      {/* Dashboard Stats */}
      {tab === 'stats' && stats && (
        <div className="space-y-6" data-testid="admin-stats">
          {/* Online Users Counter */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center relative overflow-hidden" data-testid="watching-now-stat">
              <span className="absolute top-2 right-2 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              <Play className="w-4 h-4 mx-auto mb-2 text-red-400" />
              <p className="text-3xl font-bold text-red-400">{watchingNow.count}</p>
              <p className="text-xs text-red-400/70">En train de regarder</p>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2 animate-pulse" />
              <p className="text-3xl font-bold text-green-400">{onlineStats.online_now}</p>
              <p className="text-xs text-green-400/70">En ligne maintenant</p>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-blue-400">{onlineStats.last_hour}</p>
              <p className="text-xs text-blue-400/70">Derniere heure</p>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-purple-400">{onlineStats.last_24h}</p>
              <p className="text-xs text-purple-400/70">Dernieres 24h</p>
            </div>
          </div>

          {/* Live watchers list */}
          {watchingNow.count > 0 && (
            <div className="bg-card border border-red-500/20 rounded-xl overflow-hidden" data-testid="live-watchers-list">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-red-500/5">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Play className="w-4 h-4 text-red-400" />
                  En direct - {watchingNow.count} utilisateur{watchingNow.count > 1 ? 's' : ''}
                </h3>
                <span className="text-[10px] uppercase tracking-wider text-red-400/70 font-mono">Rafraichi toutes les 15s</span>
              </div>
              <div className="divide-y divide-border max-h-72 overflow-y-auto">
                {watchingNow.watchers.map((w, idx) => (
                  <div key={`${w.user_id}-${idx}`} className="flex items-center gap-3 px-4 py-2.5">
                    {w.poster_path ? (
                      <img src={w.poster_path?.startsWith('http') ? w.poster_path : `https://image.tmdb.org/t/p/w92${w.poster_path}`} alt="" className="w-9 h-14 rounded object-cover bg-secondary" />
                    ) : (
                      <div className="w-9 h-14 rounded bg-secondary flex items-center justify-center"><Play className="w-4 h-4 text-muted-foreground" /></div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{w.username || 'Utilisateur'}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        <span className="uppercase mr-2 opacity-70">{w.content_type}</span>
                        <span className="italic">{w.title || '—'}</span>
                      </p>
                    </div>
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {w.started_at ? new Date(w.started_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Utilisateurs', val: stats.total_users, color: 'text-blue-400' },
              { label: 'VIP', val: stats.vip_users, color: 'text-yellow-400' },
              { label: 'VIP+', val: stats.vip_plus_users, color: 'text-purple-400' },
              { label: 'Contenu Total', val: stats.total_content, color: 'text-green-400' },
            ].map(s => (
              <div key={s.label} className="bg-card border border-border rounded-xl p-4 text-center">
                <p className={`text-3xl font-bold ${s.color}`}>{s.val}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {[
              { label: 'Chaines TV', val: stats.tv_channels, icon: <Tv className="w-4 h-4" /> },
              { label: 'Radio', val: stats.radio_stations, icon: <Radio className="w-4 h-4" /> },
              { label: 'Musique', val: stats.music, icon: <Music className="w-4 h-4" /> },
              { label: 'Logiciels', val: stats.software, icon: <Monitor className="w-4 h-4" /> },
              { label: 'Jeux', val: stats.games, icon: <Gamepad2 className="w-4 h-4" /> },
              { label: 'Ebooks', val: stats.ebooks, icon: <BookOpen className="w-4 h-4" /> },
              { label: 'Retrogaming', val: stats.retrogaming, icon: <Gamepad2 className="w-4 h-4" /> },
              { label: 'Feedback', val: stats.total_feedback, icon: <MessageSquare className="w-4 h-4" /> },
              { label: 'Demandes', val: stats.total_requests, icon: <MessageSquare className="w-4 h-4" /> },
              { label: 'Playlists', val: stats.total_playlists, icon: <Film className="w-4 h-4" /> },
            ].map(s => (
              <div key={s.label} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary">{s.icon}</div>
                <div><p className="text-lg font-bold">{s.val}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
              </div>
            ))}
          </div>

          {/* TMDB Global Stats */}
          {(stats.tmdb_movies > 0 || stats.tmdb_series > 0) && (
            <div data-testid="tmdb-totals">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2"><Film className="w-5 h-5 text-blue-400" />Catalogue TMDB</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-blue-400" data-testid="tmdb-movies-count">{(stats.tmdb_movies || 0).toLocaleString('fr-FR')}</p>
                  <p className="text-sm text-blue-400/70">Films TMDB</p>
                </div>
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-purple-400" data-testid="tmdb-series-count">{(stats.tmdb_series || 0).toLocaleString('fr-FR')}</p>
                  <p className="text-sm text-purple-400/70">Series TMDB</p>
                </div>
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-green-400" data-testid="tmdb-episodes-count">~{(stats.tmdb_episodes || 0).toLocaleString('fr-FR')}</p>
                  <p className="text-sm text-green-400/70">Episodes (est.)</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Broadcast */}
      {tab === 'broadcast' && (
        <div className="bg-card border border-border rounded-xl p-6 max-w-lg" data-testid="admin-broadcast">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Send className="w-5 h-5" />Envoyer un message a tous</h2>
          <div className="space-y-4">
            <div><label className="text-sm font-medium">Sujet</label><input type="text" value={broadcastForm.subject} onChange={e => setBroadcastForm(p => ({ ...p, subject: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background outline-none" placeholder="Sujet du message" /></div>
            <div><label className="text-sm font-medium">Contenu</label><textarea value={broadcastForm.content} onChange={e => setBroadcastForm(p => ({ ...p, content: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background outline-none" rows={4} placeholder="Contenu du message" /></div>
            <button onClick={sendBroadcast} className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-medium flex items-center gap-2"><Send className="w-4 h-4" />Envoyer a tous</button>
          </div>
        </div>
      )}

      {/* TV Channels */}
      {tab === 'tvchannels' && (
        <>
          <ContentTable items={tvChannels} columns={[{ key: 'name', label: 'Nom' }, { key: 'category', label: 'Categorie' }, { key: 'country', label: 'Pays' }, { key: 'quality', label: 'Qualite' }]}
            onEdit={(item) => handleEdit('tvchannels', item)} onDelete={(id) => handleDelete('/api/admin/tv-channels', id, 'cette chaine')}
            onToggle={(id) => handleToggle('/api/admin/tv-channels', id, tvChannels, setTvChannels)}
            searchTerm={searchTerms.tv || ''} setSearchTerm={v => setSearchTerms(p => ({ ...p, tv: v }))}
            onAdd={() => handleAdd('tvchannels', tvFields)} addLabel="Chaines TV" type="tv" />
          {showForm === 'tvchannels' && <ContentForm fields={tvFields} data={formData} setData={setFormData} onSubmit={() => handleSubmit('tvchannels', '/api/admin/tv-channels')} onCancel={() => setShowForm(null)} title={editingId ? 'Modifier la chaine' : 'Ajouter une chaine'} />}
        </>
      )}

      {/* Radio */}
      {tab === 'radio' && (
        <>
          <ContentTable items={radioStations} columns={[{ key: 'name', label: 'Nom' }, { key: 'genre', label: 'Genre' }, { key: 'country', label: 'Pays' }, { key: 'frequency', label: 'Frequence' }]}
            onEdit={(item) => handleEdit('radio', item)} onDelete={(id) => handleDelete('/api/admin/radio-stations', id, 'cette station')}
            onToggle={(id) => handleToggle('/api/admin/radio-stations', id, radioStations, setRadioStations)}
            searchTerm={searchTerms.radio || ''} setSearchTerm={v => setSearchTerms(p => ({ ...p, radio: v }))}
            onAdd={() => handleAdd('radio', radioFields)} addLabel="Stations Radio" type="radio" />
          {showForm === 'radio' && <ContentForm fields={radioFields} data={formData} setData={setFormData} onSubmit={() => handleSubmit('radio', '/api/admin/radio-stations')} onCancel={() => setShowForm(null)} title={editingId ? 'Modifier la station' : 'Ajouter une station'} />}
        </>
      )}

      {/* Music */}
      {tab === 'music' && (
        <>
          <ContentTable items={musicContent} columns={[{ key: 'title', label: 'Titre' }, { key: 'artist', label: 'Artiste' }, { key: 'genre', label: 'Genre' }]}
            onEdit={(item) => handleEdit('music', item)} onDelete={(id) => handleDelete('/api/admin/music', id, 'ce contenu')}
            onToggle={(id) => handleToggle('/api/admin/music', id, musicContent, setMusicContent)}
            searchTerm={searchTerms.music || ''} setSearchTerm={v => setSearchTerms(p => ({ ...p, music: v }))}
            onAdd={() => handleAdd('music', musicFields)} addLabel="Contenu Musical" type="music" />
          {showForm === 'music' && <ContentForm fields={musicFields} data={formData} setData={setFormData} onSubmit={() => handleSubmit('music', '/api/admin/music')} onCancel={() => setShowForm(null)} title={editingId ? 'Modifier' : 'Ajouter un contenu musical'} />}
        </>
      )}

      {/* Software */}
      {tab === 'software' && (
        <>
          <ContentTable items={softwareItems} columns={[{ key: 'name', label: 'Nom' }, { key: 'developer', label: 'Developpeur' }, { key: 'category', label: 'Categorie' }, { key: 'platform', label: 'Plateforme' }]}
            onEdit={(item) => handleEdit('software', item)} onDelete={(id) => handleDelete('/api/admin/software', id, 'ce logiciel')}
            onToggle={(id) => handleToggle('/api/admin/software', id, softwareItems, setSoftwareItems)}
            searchTerm={searchTerms.soft || ''} setSearchTerm={v => setSearchTerms(p => ({ ...p, soft: v }))}
            onAdd={() => handleAdd('software', softFields)} addLabel="Logiciels" type="software" />
          {showForm === 'software' && <ContentForm fields={softFields} data={formData} setData={setFormData} onSubmit={() => handleSubmit('software', '/api/admin/software')} onCancel={() => setShowForm(null)} title={editingId ? 'Modifier le logiciel' : 'Ajouter un logiciel'} />}
        </>
      )}

      {/* Games */}
      {tab === 'games' && (
        <>
          <ContentTable items={gamesItems} columns={[{ key: 'title', label: 'Titre' }, { key: 'developer', label: 'Developpeur' }, { key: 'genre', label: 'Genre' }, { key: 'platform', label: 'Plateforme' }]}
            onEdit={(item) => handleEdit('games', item)} onDelete={(id) => handleDelete('/api/admin/games', id, 'ce jeu')}
            onToggle={(id) => handleToggle('/api/admin/games', id, gamesItems, setGamesItems)}
            searchTerm={searchTerms.games || ''} setSearchTerm={v => setSearchTerms(p => ({ ...p, games: v }))}
            onAdd={() => handleAdd('games', gameFields)} addLabel="Jeux" type="games" />
          {showForm === 'games' && <ContentForm fields={gameFields} data={formData} setData={setFormData} onSubmit={() => handleSubmit('games', '/api/admin/games')} onCancel={() => setShowForm(null)} title={editingId ? 'Modifier le jeu' : 'Ajouter un jeu'} />}
        </>
      )}

      {/* Ebooks */}
      {tab === 'ebooks' && (
        <>
          <ContentTable items={ebooksItems} columns={[{ key: 'title', label: 'Titre' }, { key: 'author', label: 'Auteur' }, { key: 'category', label: 'Categorie' }, { key: 'language', label: 'Langue' }]}
            onEdit={(item) => handleEdit('ebooks', item)} onDelete={(id) => handleDelete('/api/admin/ebooks', id, 'cet ebook')}
            onToggle={(id) => handleToggle('/api/admin/ebooks', id, ebooksItems, setEbooksItems)}
            searchTerm={searchTerms.ebooks || ''} setSearchTerm={v => setSearchTerms(p => ({ ...p, ebooks: v }))}
            onAdd={() => handleAdd('ebooks', ebookFields)} addLabel="Ebooks" type="ebooks" />
          {showForm === 'ebooks' && <ContentForm fields={ebookFields} data={formData} setData={setFormData} onSubmit={() => handleSubmit('ebooks', '/api/admin/ebooks')} onCancel={() => setShowForm(null)} title={editingId ? 'Modifier' : 'Ajouter un ebook'} />}
        </>
      )}

      {/* Retrogaming */}
      {tab === 'retrogaming' && (
        <>
          <ContentTable items={retrogaming} columns={[{ key: 'name', label: 'Nom' }, { key: 'category', label: 'Categorie' }, { key: 'url', label: 'URL' }]}
            onEdit={(item) => handleEdit('retrogaming', item)} onDelete={(id) => handleDelete('/api/admin/retrogaming', id, 'cette source')}
            onToggle={(id) => handleToggle('/api/admin/retrogaming', id, retrogaming, setRetrogaming)}
            searchTerm={searchTerms.retro || ''} setSearchTerm={v => setSearchTerms(p => ({ ...p, retro: v }))}
            onAdd={() => handleAdd('retrogaming', retroFields)} addLabel="Sources Retrogaming" type="retrogaming" />
          {showForm === 'retrogaming' && <ContentForm fields={retroFields} data={formData} setData={setFormData} onSubmit={() => handleSubmit('retrogaming', '/api/admin/retrogaming')} onCancel={() => setShowForm(null)} title={editingId ? 'Modifier' : 'Ajouter une source'} />}
        </>
      )}

      {/* Content Requests */}
      {tab === 'requests' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden" data-testid="admin-requests">
          <div className="p-4 border-b border-border"><h2 className="font-bold">Demandes de contenu ({requests.length})</h2></div>
          {requests.length === 0 ? <p className="text-center py-8 text-muted-foreground">Aucune demande</p> : (
            <div className="divide-y divide-border">
              {requests.map(r => (
                <div key={r._id} className="p-4 hover:bg-secondary/20">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-medium">{r.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{r.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">Par {r.username || 'Anonyme'} - Type: {r.content_type}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${r.status === 'approved' ? 'bg-green-500/20 text-green-400' : r.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {r.status === 'approved' ? 'Approuve' : r.status === 'rejected' ? 'Rejete' : 'En attente'}
                      </span>
                      <button onClick={() => updateRequestStatus(r._id, 'approved')} className="px-2 py-1 text-xs rounded bg-green-500/20 text-green-400 hover:bg-green-500/30">Approuver</button>
                      <button onClick={() => updateRequestStatus(r._id, 'rejected')} className="px-2 py-1 text-xs rounded bg-red-500/20 text-red-400 hover:bg-red-500/30">Rejeter</button>
                      <button onClick={() => handleDelete('/api/admin/content-requests', r._id, 'cette demande')} className="p-1 text-muted-foreground hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Users */}
      {tab === 'users' && (
        <div className="space-y-4" data-testid="admin-users">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input type="text" placeholder="Rechercher un utilisateur..." value={userSearch} onChange={e => { setUserSearch(e.target.value); setUserPage(1); }} className="pl-9 pr-3 py-2 rounded-lg border border-input bg-background outline-none w-full" /></div>
            <div className="flex gap-1.5 overflow-x-auto">
              {[{ id: 'all', label: 'Tous' }, { id: 'admin', label: 'Admin' }, { id: 'vip', label: 'VIP' }, { id: 'vip_plus', label: 'VIP+' }, { id: 'uploader', label: 'Uploader' }].map(f => (
                <button key={f.id} onClick={() => { setUserFilter(f.id); setUserPage(1); }} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${userFilter === f.id ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>{f.label}</button>
              ))}
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border bg-secondary/30"><th className="px-4 py-3 text-left">Utilisateur</th><th className="px-4 py-3 text-left">Email</th><th className="px-4 py-3 text-left">Role</th><th className="px-4 py-3 text-left">VIP</th><th className="px-4 py-3 text-left">VIP+</th><th className="px-4 py-3 text-left">Actions</th></tr></thead>
                <tbody>
                  {paginatedUsers.map(u => (
                    <tr key={u._id} className="border-b border-border/50 hover:bg-secondary/20">
                      <td className="px-4 py-3 font-medium">{u.username}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{u.email}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${u.is_admin ? 'bg-red-500/20 text-red-400' : u.is_uploader ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'}`}>{u.is_admin ? 'Admin' : u.is_uploader ? 'Uploader' : 'User'}</span></td>
                      <td className="px-4 py-3"><button onClick={() => updateUserRole(u._id, 'is_vip', !u.is_vip)} className={`px-2 py-0.5 rounded-full text-xs ${u.is_vip ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-400 hover:bg-yellow-500/10'}`}>{u.is_vip ? 'VIP' : '-'}</button></td>
                      <td className="px-4 py-3"><button onClick={() => updateUserRole(u._id, 'is_vip_plus', !u.is_vip_plus)} className={`px-2 py-0.5 rounded-full text-xs ${u.is_vip_plus ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-500/20 text-gray-400 hover:bg-purple-500/10'}`}>{u.is_vip_plus ? 'VIP+' : '-'}</button></td>
                      <td className="px-4 py-3 flex gap-1">
                        <button onClick={() => openUserEdit(u)} className="p-1 text-muted-foreground hover:text-blue-400" title="Modifier"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => updateUserRole(u._id, 'is_uploader', !u.is_uploader)} className="text-xs text-muted-foreground hover:text-blue-400 px-1">UP</button>
                        <button onClick={() => deleteUser(u._id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-3 border-t border-border">
                <span className="text-xs text-muted-foreground">{filteredUsers.length} utilisateurs</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setUserPage(p => Math.max(1, p - 1))} disabled={userPage === 1} className="p-1 rounded hover:bg-secondary disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                  <span className="text-sm">{userPage}/{totalPages}</span>
                  <button onClick={() => setUserPage(p => Math.min(totalPages, p + 1))} disabled={userPage === totalPages} className="p-1 rounded hover:bg-secondary disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </div>
          {/* User Edit Modal */}
          {editingUser && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setEditingUser(null)}>
              <div className="bg-card border border-border rounded-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">Modifier l'utilisateur</h3>
                  <button onClick={() => setEditingUser(null)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-3">
                  <div><label className="text-sm font-medium">Nom d'utilisateur</label>
                    <input type="text" value={userEditForm.username || ''} onChange={e => setUserEditForm(p => ({ ...p, username: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background outline-none text-sm" /></div>
                  <div><label className="text-sm font-medium">Email</label>
                    <input type="email" value={userEditForm.email || ''} onChange={e => setUserEditForm(p => ({ ...p, email: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background outline-none text-sm" /></div>
                  <div><label className="text-sm font-medium">Nouveau mot de passe (optionnel)</label>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Laisser vide pour ne pas changer" className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background outline-none text-sm" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    {[{ key: 'is_admin', label: 'Admin', color: 'text-red-400' }, { key: 'is_vip', label: 'VIP', color: 'text-yellow-400' }, { key: 'is_vip_plus', label: 'VIP+', color: 'text-purple-400' }, { key: 'is_uploader', label: 'Uploader', color: 'text-blue-400' }].map(r => (
                      <label key={r.key} className="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-secondary cursor-pointer">
                        <input type="checkbox" checked={userEditForm[r.key] || false} onChange={e => setUserEditForm(p => ({ ...p, [r.key]: e.target.checked }))} className="w-4 h-4" />
                        <span className={`text-sm font-medium ${r.color}`}>{r.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 mt-5">
                  <button onClick={saveUserEdit} className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm"><Save className="w-4 h-4 inline mr-1" />Sauvegarder</button>
                  <button onClick={() => setEditingUser(null)} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-secondary">Annuler</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Staff Messages */}
      {tab === 'messages' && (
        <div className="space-y-4" data-testid="admin-messages">
          {messages.length === 0 ? <p className="text-center py-8 text-muted-foreground">Aucun message</p> :
            messages.map(m => (
              <div key={m._id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div><span className="font-medium">{m.username}</span><span className="text-xs text-muted-foreground ml-2">{m.email}</span></div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${m.status === 'replied' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{m.status === 'replied' ? 'Repondu' : 'En attente'}</span>
                </div>
                <h3 className="font-bold">{m.subject}</h3>
                <p className="text-sm text-muted-foreground mt-1">{m.message}</p>
                {m.reply && <div className="mt-3 p-3 bg-secondary/30 rounded-lg"><p className="text-xs text-muted-foreground mb-1">Reponse :</p><p className="text-sm">{m.reply}</p></div>}
                {!m.reply && <button onClick={() => replyMessage(m._id)} className="mt-3 text-sm text-primary hover:underline">Repondre</button>}
              </div>
            ))
          }
        </div>
      )}

      {/* Changelogs */}
      {tab === 'changelogs' && (
        <>
          <ContentTable items={changelogs} columns={[{ key: 'version', label: 'Version' }, { key: 'title', label: 'Titre' }, { key: 'release_date', label: 'Date' }]}
            onEdit={(item) => handleEdit('changelogs', item)} onDelete={(id) => handleDelete('/api/admin/changelogs', id, 'ce changelog')}
            searchTerm={searchTerms.logs || ''} setSearchTerm={v => setSearchTerms(p => ({ ...p, logs: v }))}
            onAdd={() => handleAdd('changelogs', changelogFields)} addLabel="Changelogs" type="changelogs" />
          {showForm === 'changelogs' && <ContentForm fields={changelogFields} data={formData} setData={setFormData} onSubmit={() => handleSubmit('changelogs', '/api/admin/changelogs')} onCancel={() => setShowForm(null)} title={editingId ? 'Modifier le changelog' : 'Ajouter un changelog'} />}
        </>
      )}

      {/* Modules */}
      {tab === 'modules' && (
        <div className="bg-card border border-border rounded-xl p-6" data-testid="admin-modules">
          <h2 className="text-xl font-bold mb-4">Modules de la page d'accueil</h2>
          <p className="text-sm text-muted-foreground mb-6">Activez, desactivez et reordonnez les sections de la page d'accueil. Glissez-deposez pour changer l'ordre.</p>
          
          {/* Module Order State */}
          <ModuleOrderManager 
            modules={modules} 
            moduleLabels={moduleLabels} 
            toggleModule={toggleModule}
            onReorder={async (newOrder) => {
              try {
                await API.put('/api/admin/site-settings', { setting_key: 'module_order', setting_value: newOrder });
                toast({ title: 'Ordre des modules mis a jour' });
              } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
            }}
          />
        </div>
      )}

      {/* Cinema Rooms */}
      {tab === 'cinema' && (
        <div className="space-y-6" data-testid="admin-cinema">
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Creer une salle cinema</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input type="text" placeholder="Nom de la salle" value={newRoom.name} onChange={e => setNewRoom(p => ({ ...p, name: e.target.value }))} className="px-4 py-2 rounded-lg border border-input bg-background outline-none" />
              <input type="text" placeholder="Film a diffuser" value={newRoom.movie_title} onChange={e => setNewRoom(p => ({ ...p, movie_title: e.target.value }))} className="px-4 py-2 rounded-lg border border-input bg-background outline-none" />
              <input type="date" value={newRoom.date} onChange={e => setNewRoom(p => ({ ...p, date: e.target.value }))} className="px-4 py-2 rounded-lg border border-input bg-background outline-none" />
              <input type="time" value={newRoom.time} onChange={e => setNewRoom(p => ({ ...p, time: e.target.value }))} className="px-4 py-2 rounded-lg border border-input bg-background outline-none" />
              <input type="number" placeholder="Capacite" value={newRoom.capacity} onChange={e => setNewRoom(p => ({ ...p, capacity: parseInt(e.target.value) || 50 }))} className="px-4 py-2 rounded-lg border border-input bg-background outline-none" />
            </div>
            <button onClick={createRoom} className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-medium">Creer la salle</button>
          </div>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border"><h2 className="font-bold">Salles existantes ({cinemaRooms.length})</h2></div>
            {cinemaRooms.length === 0 ? <p className="text-center py-8 text-muted-foreground">Aucune salle</p> :
              <div className="divide-y divide-border">
                {cinemaRooms.map(r => (
                  <div key={r.room_id} className="flex items-center justify-between p-4 hover:bg-secondary/30">
                    <div><p className="font-medium">{r.name}</p><p className="text-sm text-muted-foreground">{r.movie_title} - {r.date} a {r.time}</p></div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">{r.capacity} places</span>
                      <button onClick={() => deleteRoom(r.room_id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            }
          </div>
        </div>
      )}

      {/* Activity Feed */}
      {tab === 'activities' && (
        <div className="space-y-4" data-testid="admin-activities">
          <h2 className="text-xl font-bold flex items-center gap-2"><Users className="w-5 h-5" />Feed d'activites</h2>
          <p className="text-sm text-muted-foreground">Inscriptions, utilisations de codes, lectures et actions admin en temps reel.</p>

          {/* Filters */}
          {(() => null)()}
          <ActivityFeedView activities={activities} onRefresh={() => loadData('activities')} />
        </div>
      )}

      {/* TMDB Update */}
      {tab === 'tmdb' && (
        <div className="space-y-4" data-testid="admin-tmdb">
          <h2 className="text-xl font-bold flex items-center gap-2"><Film className="w-5 h-5" />Mise a jour TMDB</h2>
          <p className="text-sm text-muted-foreground">Rafraichir les donnees depuis l'API TMDB</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['trending', 'popular', 'upcoming'].map(type => (
              <button key={type} onClick={async () => {
                setTmdbUpdating(true);
                try { const { data } = await API.post('/api/admin/tmdb-update', { type }); toast({ title: data.message }); } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
                finally { setTmdbUpdating(false); }
              }} disabled={tmdbUpdating}
                className="p-6 bg-card border border-border rounded-xl text-center hover:border-primary/50 transition-colors" data-testid={`tmdb-update-${type}`}>
                <Film className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                <p className="font-bold capitalize">{type === 'trending' ? 'Tendances' : type === 'popular' ? 'Populaires' : 'Prochaines Sorties'}</p>
                <p className="text-xs text-muted-foreground mt-1">Mettre a jour</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* VIP Codes */}
      {tab === 'vipcodes' && (
        <div className="space-y-6" data-testid="admin-vipcodes">
          <h2 className="text-xl font-bold flex items-center gap-2"><Crown className="w-5 h-5 text-yellow-400" />Codes d'activation</h2>
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-bold mb-4">Générer des codes</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Type</label>
                <select value={newCodeType} onChange={e => setNewCodeType(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background outline-none text-sm" data-testid="code-type-select">
                  <option value="vip">VIP</option>
                  <option value="vip_plus">VIP+</option>
                  <option value="uploader">Uploader</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Durée (jours)</label>
                <select value={newCodeDuration} onChange={e => setNewCodeDuration(parseInt(e.target.value))} className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background outline-none text-sm" data-testid="code-duration-select" disabled={newCodeType === 'admin'}>
                  <option value={7}>7 jours</option>
                  <option value={15}>15 jours</option>
                  <option value={30}>30 jours</option>
                  <option value={60}>60 jours</option>
                  <option value={90}>90 jours</option>
                  <option value={180}>6 mois</option>
                  <option value={365}>1 an</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Quantité</label>
                <input type="number" min={1} max={50} value={newCodeQuantity} onChange={e => setNewCodeQuantity(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))} className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background outline-none text-sm" data-testid="code-quantity-input" />
              </div>
              <button onClick={async () => {
                try {
                  const { data } = await API.post('/api/admin/vip-codes', { type: newCodeType, duration_days: newCodeDuration, quantity: newCodeQuantity });
                  toast({ title: data.codes.length > 1 ? `${data.codes.length} codes générés` : `Code généré: ${data.code}` });
                  loadData('vipcodes');
                } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
              }} className="px-4 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium flex items-center justify-center gap-2" data-testid="generate-code-btn">
                <Plus className="w-4 h-4" />Générer
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">💡 Les codes "admin" donnent les droits admin sans expiration. Les autres types activent VIP/VIP+ pour la durée choisie.</p>
          </div>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border"><h3 className="font-bold">Codes ({vipCodes.length})</h3></div>
            {vipCodes.length === 0 ? <p className="text-center py-8 text-muted-foreground">Aucun code</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border bg-secondary/30"><th className="px-4 py-2 text-left">Code</th><th className="px-4 py-2 text-left">Type</th><th className="px-4 py-2 text-left">Durée</th><th className="px-4 py-2 text-left">Statut</th><th className="px-4 py-2 text-left">Date</th><th className="px-4 py-2 text-left">Actions</th></tr></thead>
                  <tbody>
                    {vipCodes.map(c => (
                      <tr key={c._id} className="border-b border-border/50 hover:bg-secondary/20">
                        <td className="px-4 py-2 font-mono font-bold">
                          <button onClick={() => { navigator.clipboard?.writeText(c.code); toast({ title: 'Code copié' }); }} className="hover:text-primary transition-colors" title="Cliquer pour copier">{c.code}</button>
                        </td>
                        <td className="px-4 py-2"><span className={`px-2 py-0.5 rounded-full text-xs ${c.type === 'admin' ? 'bg-red-500/20 text-red-400' : c.type === 'vip_plus' ? 'bg-purple-500/20 text-purple-400' : c.type === 'uploader' ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{c.type}</span></td>
                        <td className="px-4 py-2 text-xs">{c.type === 'admin' ? '∞' : `${c.duration_days || 30}j`}</td>
                        <td className="px-4 py-2">{c.is_used ? <span className="text-red-400 text-xs">Utilisé{c.used_by ? ` par ${c.used_by}` : ''}</span> : <span className="text-green-400 text-xs">Disponible</span>}</td>
                        <td className="px-4 py-2 text-xs text-muted-foreground">{c.created_at ? new Date(c.created_at).toLocaleDateString('fr-FR') : ''}</td>
                        <td className="px-4 py-2"><button onClick={async () => { try { await API.delete(`/api/admin/vip-codes/${c._id}`); toast({ title: 'Supprimé' }); loadData('vipcodes'); } catch { /* ignore */ } }} className="text-muted-foreground hover:text-red-400"><Trash2 className="w-4 h-4" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'info_banner' && (
        <div className="space-y-6" data-testid="admin-info-banner">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2"><Send className="w-5 h-5 text-blue-400" />Panneau d'information (accueil)</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!infoBanner.enabled} onChange={e => setInfoBanner(p => ({ ...p, enabled: e.target.checked }))} className="w-4 h-4" data-testid="banner-enabled-toggle" />
              <span className="text-sm font-medium">{infoBanner.enabled ? 'Activé' : 'Désactivé'}</span>
            </label>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left : Editor */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Configuration</h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Titre</label>
                  <input type="text" value={infoBanner.title || ''} onChange={e => setInfoBanner(p => ({ ...p, title: e.target.value }))} placeholder="Ex: Sports-Stream" className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background outline-none text-sm" data-testid="banner-title-input" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Badge (à côté du titre)</label>
                  <input type="text" value={infoBanner.badge || ''} onChange={e => setInfoBanner(p => ({ ...p, badge: e.target.value }))} placeholder="Ex: by WaveWatch" className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background outline-none text-sm" data-testid="banner-badge-input" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Sous-titre (italique)</label>
                <input type="text" value={infoBanner.subtitle || ''} onChange={e => setInfoBanner(p => ({ ...p, subtitle: e.target.value }))} placeholder="Ex: Votre destination ultime pour le streaming sportif" className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background outline-none text-sm" data-testid="banner-subtitle-input" />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Description</label>
                <textarea value={infoBanner.message || ''} onChange={e => setInfoBanner(p => ({ ...p, message: e.target.value }))} rows={3} placeholder="Texte descriptif du panneau..." className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background outline-none text-sm" data-testid="banner-message-input" />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Tags (séparés par des virgules)</label>
                <input type="text" value={tagsInput} onChange={e => { setTagsInput(e.target.value); setInfoBanner(p => ({ ...p, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })); }} placeholder="Ex: Multi-sources, +15 Sports, Sans inscription" className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background outline-none text-sm" data-testid="banner-tags-input" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Image / logo (URL)</label>
                  <input type="text" value={infoBanner.image_url || ''} onChange={e => setInfoBanner(p => ({ ...p, image_url: e.target.value }))} placeholder="https://.../logo.png" className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background outline-none text-sm" data-testid="banner-image-input" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Style / couleur</label>
                  <select value={infoBanner.variant || 'info'} onChange={e => setInfoBanner(p => ({ ...p, variant: e.target.value }))} className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background outline-none text-sm" data-testid="banner-variant-select">
                    <option value="info">Info (bleu)</option>
                    <option value="success">Succès (vert)</option>
                    <option value="warning">Attention (orange)</option>
                    <option value="danger">Urgent (rouge)</option>
                    <option value="promo">Promo (violet)</option>
                    <option value="announce">Annonce (cyan)</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-border pt-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">Bouton principal (CTA)</p>
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" value={infoBanner.link_label || ''} onChange={e => setInfoBanner(p => ({ ...p, link_label: e.target.value }))} placeholder="Texte : Acceder au site" className="px-3 py-2 rounded-lg border border-input bg-background outline-none text-sm" data-testid="banner-link-label-input" />
                  <input type="text" value={infoBanner.link_url || ''} onChange={e => setInfoBanner(p => ({ ...p, link_url: e.target.value }))} placeholder="URL : /subscription ou https://..." className="px-3 py-2 rounded-lg border border-input bg-background outline-none text-sm" data-testid="banner-link-url-input" />
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Bouton secondaire (optionnel)</p>
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" value={infoBanner.link2_label || ''} onChange={e => setInfoBanner(p => ({ ...p, link2_label: e.target.value }))} placeholder="Texte : Serveur de secours" className="px-3 py-2 rounded-lg border border-input bg-background outline-none text-sm" />
                  <input type="text" value={infoBanner.link2_url || ''} onChange={e => setInfoBanner(p => ({ ...p, link2_url: e.target.value }))} placeholder="URL" className="px-3 py-2 rounded-lg border border-input bg-background outline-none text-sm" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Texte de pied (petit, sous les boutons)</label>
                <input type="text" value={infoBanner.footer_text || ''} onChange={e => setInfoBanner(p => ({ ...p, footer_text: e.target.value }))} placeholder="Ex: Football, Tennis, Basketball, et plus..." className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background outline-none text-sm" />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input type="checkbox" checked={infoBanner.dismissible !== false} onChange={e => setInfoBanner(p => ({ ...p, dismissible: e.target.checked }))} className="w-4 h-4" data-testid="banner-dismissible-toggle" />
                <span className="text-sm">Fermable par l'utilisateur <span className="text-muted-foreground text-xs">(persistant 24h par version)</span></span>
              </label>

              <div className="flex gap-2 pt-2 border-t border-border">
                <button onClick={async () => {
                  try {
                    const { data } = await API.put('/api/admin/info-banner', infoBanner);
                    setInfoBanner({ ...infoBanner, ...data.banner, tags: data.banner.tags || [] });
                    toast({ title: infoBanner.enabled ? 'Panneau activé' : 'Panneau sauvegardé' });
                  } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
                }} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2" data-testid="save-banner-btn">
                  <Save className="w-4 h-4" />Enregistrer
                </button>
                <button onClick={async () => {
                  try {
                    const next = { ...infoBanner, enabled: false };
                    const { data } = await API.put('/api/admin/info-banner', next);
                    setInfoBanner({ ...next, version: data.banner.version });
                    toast({ title: 'Panneau désactivé' });
                  } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
                }} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-secondary" data-testid="disable-banner-btn">
                  Désactiver
                </button>
              </div>
              <p className="text-xs text-muted-foreground">💡 Un changement du titre, description, boutons, etc. incrémente la version : tous les utilisateurs reverront le panneau même s'ils l'avaient fermé.</p>
            </div>

            {/* Right : Live preview */}
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Aperçu en direct</h3>
              <InfoPanelView banner={infoBanner} preview />
              {!infoBanner.title && !infoBanner.message && !infoBanner.image_url && (
                <p className="text-xs text-muted-foreground italic">Remplissez au moins un titre ou une description pour voir l'aperçu…</p>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'download_links' && (
        <div className="space-y-6" data-testid="admin-download-links">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2"><FileText className="w-5 h-5 text-emerald-400" />Module "Liens de téléchargement"</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!dlConfig.enabled} onChange={e => setDlConfig(p => ({ ...p, enabled: e.target.checked }))} className="w-4 h-4" data-testid="dl-enabled-toggle" />
              <span className="text-sm font-medium">{dlConfig.enabled ? 'Activé sur la home' : 'Désactivé'}</span>
            </label>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
              <p className="text-3xl font-bold text-emerald-400">{dlStats.total.toLocaleString('fr-FR')}</p>
              <p className="text-sm text-emerald-400/70">Liens disponibles (Supabase)</p>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <p className="text-3xl font-bold text-blue-400">+{dlStats.last_24h}</p>
              <p className="text-sm text-blue-400/70">Ajoutés ces dernières 24h</p>
            </div>
          </div>

          {/* Config */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Configuration du module</h3>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Titre (sur la home)</label>
              <input type="text" value={dlConfig.title || ''} onChange={e => setDlConfig(p => ({ ...p, title: e.target.value }))} placeholder="Derniers liens de téléchargement" className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background outline-none text-sm" data-testid="dl-title-input" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Sous-titre (optionnel)</label>
              <input type="text" value={dlConfig.subtitle || ''} onChange={e => setDlConfig(p => ({ ...p, subtitle: e.target.value }))} placeholder="Les derniers ajouts à la communauté" className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background outline-none text-sm" data-testid="dl-subtitle-input" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Nombre d'items affichés dans le slider ({dlConfig.limit})</label>
              <input type="range" min={4} max={30} value={dlConfig.limit || 12} onChange={e => setDlConfig(p => ({ ...p, limit: parseInt(e.target.value) }))} className="mt-1 w-full" data-testid="dl-limit-input" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>4</span><span>30</span></div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={dlConfig.show_quality_badge !== false} onChange={e => setDlConfig(p => ({ ...p, show_quality_badge: e.target.checked }))} className="w-4 h-4" />
              <span className="text-sm">Afficher le badge qualité (FHD/HD/4K) sur les jaquettes</span>
            </label>
            <div className="flex gap-2 pt-2 border-t border-border">
              <button onClick={async () => {
                try {
                  const { data } = await API.put('/api/admin/download-links/config', dlConfig);
                  if (data?.config) setDlConfig(data.config);
                  toast({ title: 'Module sauvegardé' });
                } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
              }} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2" data-testid="dl-save-btn">
                <Save className="w-4 h-4" />Enregistrer
              </button>
              <a href="/download-links" target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-secondary inline-flex items-center gap-2">
                Voir la page publique <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <p className="text-xs text-muted-foreground">💡 L'activation/désactivation et l'ordre du module sur la home se gèrent aussi depuis l'onglet <b>Modules</b>.</p>
          </div>

          {/* Security note */}
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
            <p className="text-sm text-emerald-400 font-medium">🔒 Sécurité : les clés Supabase (service role) sont uniquement côté backend</p>
            <p className="text-xs text-muted-foreground mt-1">Le frontend n'a jamais accès aux clés Supabase — toutes les requêtes passent par l'API WaveWatch (/api/download-links/*). Les jaquettes sont enrichies via le proxy TMDB.</p>
          </div>
        </div>
      )}

      {tab === 'vip_game' && (
        <div className="space-y-6" data-testid="admin-vip-game">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2"><Crown className="w-5 h-5 text-yellow-400" />Configuration du Jeu VIP</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!vipGameCfg.enabled} onChange={e => setVipGameCfg(p => ({ ...p, enabled: e.target.checked }))} className="w-4 h-4" data-testid="vip-game-enabled-toggle" />
              <span className="text-sm font-medium">{vipGameCfg.enabled ? 'Jeu activé' : 'Jeu désactivé'}</span>
            </label>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Affichage</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Titre du jeu</label>
                <input type="text" value={vipGameCfg.title || ''} onChange={e => setVipGameCfg(p => ({ ...p, title: e.target.value }))} className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background outline-none text-sm" data-testid="vip-game-title" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Sous-titre / Slogan</label>
                <input type="text" value={vipGameCfg.subtitle || ''} onChange={e => setVipGameCfg(p => ({ ...p, subtitle: e.target.value }))} className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background outline-none text-sm" data-testid="vip-game-subtitle" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Couleur primaire (roue)</label>
                <input type="color" value={vipGameCfg.primary_color || '#a855f7'} onChange={e => setVipGameCfg(p => ({ ...p, primary_color: e.target.value }))} className="mt-1 w-full h-10 rounded-lg border border-input bg-background cursor-pointer" data-testid="vip-game-primary-color" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Couleur secondaire (roue)</label>
                <input type="color" value={vipGameCfg.secondary_color || '#ec4899'} onChange={e => setVipGameCfg(p => ({ ...p, secondary_color: e.target.value }))} className="mt-1 w-full h-10 rounded-lg border border-input bg-background cursor-pointer" data-testid="vip-game-secondary-color" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Segments de la roue</label>
                <input type="number" min={4} max={24} value={vipGameCfg.wheel_segments || 8} onChange={e => setVipGameCfg(p => ({ ...p, wheel_segments: parseInt(e.target.value) || 8 }))} className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background outline-none text-sm" data-testid="vip-game-segments" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Gagnants visibles dans le tableau</label>
                <input type="number" min={0} max={100} value={vipGameCfg.winners_visible || 10} onChange={e => setVipGameCfg(p => ({ ...p, winners_visible: parseInt(e.target.value) || 10 }))} className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background outline-none text-sm" data-testid="vip-game-winners-visible" />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Mécanique du jeu</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Probabilité de gain ({vipGameCfg.win_rate}%)</label>
                <input type="range" min={0} max={100} step={0.5} value={vipGameCfg.win_rate || 0} onChange={e => setVipGameCfg(p => ({ ...p, win_rate: parseFloat(e.target.value) }))} className="mt-1 w-full" data-testid="vip-game-win-rate" />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>0%</span><span>50%</span><span>100%</span></div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Cooldown entre 2 parties (heures)</label>
                <input type="number" min={1} max={720} value={vipGameCfg.play_interval_hours || 24} onChange={e => setVipGameCfg(p => ({ ...p, play_interval_hours: parseInt(e.target.value) || 24 }))} className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background outline-none text-sm" data-testid="vip-game-cooldown" />
                <p className="text-[10px] text-muted-foreground mt-1">24 = 1x par jour, 168 = 1x par semaine</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Type de récompense</label>
                <select value={vipGameCfg.reward_type || 'vip'} onChange={e => setVipGameCfg(p => ({ ...p, reward_type: e.target.value }))} className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background outline-none text-sm" data-testid="vip-game-reward-type">
                  <option value="vip">VIP</option>
                  <option value="vip_plus">VIP+</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Durée de la récompense (jours)</label>
                <input type="number" min={1} max={3650} value={vipGameCfg.reward_days || 30} onChange={e => setVipGameCfg(p => ({ ...p, reward_days: parseInt(e.target.value) || 30 }))} className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background outline-none text-sm" data-testid="vip-game-reward-days" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Limite de gagnants par jour (0 = illimité)</label>
                <input type="number" min={0} max={10000} value={vipGameCfg.max_winners_per_day || 0} onChange={e => setVipGameCfg(p => ({ ...p, max_winners_per_day: parseInt(e.target.value) || 0 }))} className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background outline-none text-sm" data-testid="vip-game-max-winners" />
                <p className="text-[10px] text-muted-foreground mt-1">Au delà de cette limite, plus aucun gagnant n'est généré pour la journée.</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Messages</h3>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Message de victoire</label>
              <input type="text" value={vipGameCfg.win_message || ''} onChange={e => setVipGameCfg(p => ({ ...p, win_message: e.target.value }))} className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background outline-none text-sm" data-testid="vip-game-win-message" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Message de défaite</label>
              <input type="text" value={vipGameCfg.lose_message || ''} onChange={e => setVipGameCfg(p => ({ ...p, lose_message: e.target.value }))} className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background outline-none text-sm" data-testid="vip-game-lose-message" />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button disabled={vipGameSaving} onClick={async () => {
              setVipGameSaving(true);
              try {
                const { data } = await API.put('/api/admin/vip-game/config', vipGameCfg);
                if (data?.config) setVipGameCfg(p => ({ ...p, ...data.config }));
                toast({ title: 'Configuration enregistrée' });
              } catch (e) { toast({ title: 'Erreur', description: e.response?.data?.detail || 'Erreur', variant: 'destructive' }); }
              setVipGameSaving(false);
            }} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 disabled:opacity-50" data-testid="vip-game-save-btn">
              <Save className="w-4 h-4" />{vipGameSaving ? 'Sauvegarde...' : 'Enregistrer'}
            </button>
            <button onClick={async () => {
              if (!window.confirm('Réinitialiser le cooldown pour tous les utilisateurs ? Tout le monde pourra rejouer immédiatement.')) return;
              try {
                const { data } = await API.post('/api/admin/vip-game/reset', {});
                toast({ title: 'Cooldown réinitialisé', description: `${data.deleted || 0} entrées supprimées` });
              } catch (e) { toast({ title: 'Erreur', description: e.response?.data?.detail || 'Erreur', variant: 'destructive' }); }
            }} className="px-4 py-2 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 text-sm font-medium" data-testid="vip-game-reset-btn">
              Réinitialiser le cooldown global
            </button>
            <a href="/vip-game" target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-secondary inline-flex items-center gap-2">
              Voir la page publique <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
            <p className="text-sm text-yellow-400 font-medium">💡 À savoir</p>
            <ul className="text-xs text-muted-foreground mt-2 space-y-1 list-disc list-inside">
              <li>La probabilité de gain est cachée côté frontend pour préserver la magie du tirage.</li>
              <li>Avec une probabilité à 100%, tout joueur gagnera (utile pour des opérations spéciales / cadeaux).</li>
              <li>La limite "gagnants par jour" est la sécurité ultime contre les abus si vous mettez un win_rate élevé.</li>
            </ul>
          </div>
        </div>
      )}

      {tab === 'reviews' && (
        <div className="space-y-6" data-testid="admin-reviews">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2"><MessageSquare className="w-5 h-5 text-blue-400" />Avis de la communauté</h2>
            <button onClick={() => loadData('reviews')} className="px-3 py-1.5 rounded-lg text-xs border border-border hover:bg-secondary">Rafraîchir</button>
          </div>

          {/* Averages */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { key: 'contenu', label: 'Contenu', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
              { key: 'fonctionnalites', label: 'Fonctionnalités', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
              { key: 'design', label: 'Design', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
            ].map(s => (
              <div key={s.key} className={`rounded-xl border p-4 ${s.bg}`}>
                <p className={`text-3xl font-bold ${s.color}`}>{(reviewsAvgs[s.key] || 0).toFixed(1)}<span className="text-sm opacity-70">/10</span></p>
                <p className={`text-xs ${s.color} opacity-80`}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Reviews list */}
          {reviews.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">Aucun avis pour le moment</div>
          ) : (
            <div className="space-y-3">
              {reviews.map(r => (
                <div key={r._id} className="bg-card border border-border rounded-xl p-4" data-testid={`admin-review-${r._id}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold">{r.username || 'Anonyme'}</span>
                      {r.is_admin && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">Admin</span>}
                      {r.is_uploader && !r.is_admin && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">Uploader</span>}
                      {r.is_vip_plus && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">VIP+</span>}
                      {r.is_vip && !r.is_vip_plus && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">VIP</span>}
                      {r.edited_by_admin && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">Modéré</span>}
                      <span className="text-[11px] text-muted-foreground">{r.created_at ? new Date(r.created_at).toLocaleString('fr-FR') : ''}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => {
                        setEditingReview(r._id);
                        setReviewForm({
                          message: r.message || '',
                          contenu_score: r.contenu_score || 5,
                          fonctionnalites_score: r.fonctionnalites_score || 5,
                          design_score: r.design_score || 5,
                        });
                      }} className="px-2.5 py-1 rounded-lg text-xs border border-border hover:bg-secondary inline-flex items-center gap-1" data-testid={`review-edit-${r._id}`}>
                        <Edit className="w-3 h-3" />Modifier
                      </button>
                      <button onClick={async () => {
                        if (!window.confirm(`Supprimer définitivement l'avis de ${r.username || 'cet utilisateur'} ?`)) return;
                        try {
                          await API.delete(`/api/admin/platform-reviews/${r._id}`);
                          toast({ title: 'Avis supprimé' });
                          loadData('reviews');
                        } catch (e) { toast({ title: 'Erreur', description: e.response?.data?.detail || 'Erreur', variant: 'destructive' }); }
                      }} className="px-2.5 py-1 rounded-lg text-xs border border-red-500/40 text-red-400 hover:bg-red-500/10 inline-flex items-center gap-1" data-testid={`review-delete-${r._id}`}>
                        <Trash2 className="w-3 h-3" />Supprimer
                      </button>
                    </div>
                  </div>

                  {editingReview === r._id ? (
                    <div className="space-y-3">
                      <textarea value={reviewForm.message} onChange={e => setReviewForm(f => ({ ...f, message: e.target.value.slice(0, 500) }))}
                        className="w-full px-3 py-2 rounded-lg border border-input bg-background outline-none text-sm" rows={3} maxLength={500}
                        data-testid={`review-edit-message-${r._id}`} />
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { key: 'contenu_score', label: 'Contenu' },
                          { key: 'fonctionnalites_score', label: 'Fonctionnalités' },
                          { key: 'design_score', label: 'Design' },
                        ].map(s => (
                          <div key={s.key}>
                            <label className="text-xs font-medium text-muted-foreground">{s.label} ({reviewForm[s.key]}/10)</label>
                            <input type="range" min={1} max={10} value={reviewForm[s.key]} onChange={e => setReviewForm(f => ({ ...f, [s.key]: parseInt(e.target.value) }))}
                              className="w-full mt-1" data-testid={`review-edit-${s.key}-${r._id}`} />
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={async () => {
                          try {
                            await API.put(`/api/admin/platform-reviews/${r._id}`, reviewForm);
                            toast({ title: 'Avis modifié' });
                            setEditingReview(null);
                            loadData('reviews');
                          } catch (e) { toast({ title: 'Erreur', description: e.response?.data?.detail || 'Erreur', variant: 'destructive' }); }
                        }} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium inline-flex items-center gap-1" data-testid={`review-save-${r._id}`}>
                          <Save className="w-3 h-3" />Enregistrer
                        </button>
                        <button onClick={() => setEditingReview(null)} className="px-3 py-1.5 rounded-lg text-xs border border-border hover:bg-secondary">Annuler</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 gap-3 mb-3 text-xs">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-1.5"><span className="text-emerald-400">Contenu</span> <b>{r.contenu_score}/10</b></div>
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-1.5"><span className="text-blue-400">Fonctionnalités</span> <b>{r.fonctionnalites_score}/10</b></div>
                        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-1.5"><span className="text-purple-400">Design</span> <b>{r.design_score}/10</b></div>
                      </div>
                      {r.message && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{r.message}</p>}
                      {!r.message && <p className="text-xs text-muted-foreground italic">(Aucun message texte)</p>}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'events' && (
        <EventsAdminPanel toast={toast} />
      )}
    </div>
  );
}
