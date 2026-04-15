import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useNavigate, Link } from 'react-router-dom';
import API from '../lib/api';
import { Shield, Users, BarChart3, MessageSquare, Settings, Crown, Trash2, Film, Calendar, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [modules, setModules] = useState({
    hero: true, trending_movies: true, trending_tv_shows: true, popular_anime: true,
    popular_collections: true, public_playlists: true, trending_actors: true,
    trending_tv_channels: true, subscription_offer: true, random_content: true,
    football_calendar: true, calendar_widget: true, sports_promo: true, livewatch_promo: true, vip_game_promo: true
  });
  const [cinemaRooms, setCinemaRooms] = useState([]);
  const [newRoom, setNewRoom] = useState({ name: '', movie_title: '', date: '', time: '', capacity: 50 });

  useEffect(() => { if (!authLoading && (!user || !user.is_admin)) navigate('/'); }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user?.is_admin) {
      if (tab === 'stats') API.get('/api/admin/stats').then(({ data }) => setStats(data)).catch(() => {});
      if (tab === 'users') API.get('/api/admin/users').then(({ data }) => setUsers(data.users || [])).catch(() => {});
      if (tab === 'messages') API.get('/api/staff-messages').then(({ data }) => setMessages(data.messages || [])).catch(() => {});
      if (tab === 'modules') API.get('/api/admin/site-settings/home_modules').then(({ data }) => { if (data.setting_value && Object.keys(data.setting_value).length) setModules(prev => ({ ...prev, ...data.setting_value })); }).catch(() => {});
      if (tab === 'cinema') API.get('/api/admin/cinema-rooms').then(({ data }) => setCinemaRooms(data.rooms || [])).catch(() => {});
    }
  }, [user, tab]);

  if (authLoading || !user?.is_admin) return null;

  const updateUserRole = async (userId, field, value) => {
    try {
      await API.put(`/api/admin/users/${userId}`, { [field]: value });
      toast({ title: 'Utilisateur mis a jour' });
      API.get('/api/admin/users').then(({ data }) => setUsers(data.users || []));
    } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Supprimer cet utilisateur ?')) return;
    try { await API.delete(`/api/admin/users/${userId}`); toast({ title: 'Utilisateur supprime' }); setUsers(u => u.filter(x => x._id !== userId)); }
    catch { toast({ title: 'Erreur', variant: 'destructive' }); }
  };

  const replyMessage = async (msgId) => {
    const reply = prompt('Votre reponse :');
    if (!reply) return;
    try { await API.post('/api/staff-messages/reply', { message_id: msgId, reply }); toast({ title: 'Reponse envoyee' }); API.get('/api/staff-messages').then(({ data }) => setMessages(data.messages || [])); }
    catch { toast({ title: 'Erreur', variant: 'destructive' }); }
  };

  const toggleModule = async (key) => {
    const newModules = { ...modules, [key]: !modules[key] };
    setModules(newModules);
    try {
      await API.put('/api/admin/site-settings', { setting_key: 'home_modules', setting_value: newModules });
      toast({ title: 'Module mis a jour' });
    } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
  };

  const createRoom = async () => {
    if (!newRoom.name || !newRoom.movie_title) return;
    try {
      await API.post('/api/admin/cinema-rooms', newRoom);
      toast({ title: 'Salle creee' });
      setNewRoom({ name: '', movie_title: '', date: '', time: '', capacity: 50 });
      API.get('/api/admin/cinema-rooms').then(({ data }) => setCinemaRooms(data.rooms || []));
    } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
  };

  const deleteRoom = async (roomId) => {
    try {
      await API.delete(`/api/admin/cinema-rooms/${roomId}`);
      toast({ title: 'Salle supprimee' });
      setCinemaRooms(r => r.filter(x => x.room_id !== roomId));
    } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
  };

  const tabs = [
    { id: 'stats', label: 'Stats', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'users', label: 'Utilisateurs', icon: <Users className="w-4 h-4" /> },
    { id: 'messages', label: 'Messages', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'modules', label: 'Modules accueil', icon: <Settings className="w-4 h-4" /> },
    { id: 'cinema', label: 'Salles cinema', icon: <Film className="w-4 h-4" /> },
  ];

  const moduleLabels = {
    hero: 'Hero (Carrousel)', trending_movies: 'Films Tendance', trending_tv_shows: 'Series Tendance',
    popular_anime: 'Animes Populaires', popular_collections: 'Collections Populaires',
    public_playlists: 'Playlists Communaute', trending_actors: 'Acteurs Tendance',
    trending_tv_channels: 'Chaines TV', subscription_offer: 'Offre VIP',
    random_content: 'Contenu Aleatoire', football_calendar: 'Calendrier Football',
    calendar_widget: 'Prochaines Sorties', sports_promo: 'Promo Sports', livewatch_promo: 'Promo LiveWatch',
    vip_game_promo: 'Promo Jeu VIP'
  };

  return (
    <div className="container mx-auto px-4 py-8" data-testid="admin-page">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-3"><Shield className="w-8 h-8 text-red-400" />Administration</h1>
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} data-testid={`admin-tab-${t.id}`}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${tab === t.id ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'}`}>{t.icon}{t.label}</button>
        ))}
      </div>

      {tab === 'stats' && stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4" data-testid="admin-stats">
          {[{label:'Utilisateurs',val:stats.total_users,color:'text-blue-400'},{label:'VIP',val:stats.vip_users,color:'text-yellow-400'},{label:'Feedback',val:stats.total_feedback,color:'text-green-400'},{label:'Demandes',val:stats.total_requests,color:'text-purple-400'},{label:'Playlists',val:stats.total_playlists,color:'text-pink-400'}].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4 text-center">
              <p className={`text-3xl font-bold ${s.color}`}>{s.val}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'users' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden" data-testid="admin-users">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-secondary/30"><th className="px-4 py-3 text-left">Utilisateur</th><th className="px-4 py-3 text-left">Email</th><th className="px-4 py-3 text-left">Role</th><th className="px-4 py-3 text-left">VIP</th><th className="px-4 py-3 text-left">VIP+</th><th className="px-4 py-3 text-left">Actions</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id} className="border-b border-border/50 hover:bg-secondary/30">
                    <td className="px-4 py-3 font-medium">{u.username}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${u.is_admin ? 'bg-red-500/20 text-red-400' : u.is_uploader ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        {u.is_admin ? 'Admin' : u.is_uploader ? 'Uploader' : 'User'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => updateUserRole(u._id, 'is_vip', !u.is_vip)} className={`px-2 py-0.5 rounded-full text-xs transition-colors ${u.is_vip ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-400 hover:bg-yellow-500/10'}`}>
                        {u.is_vip ? 'VIP' : '-'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => updateUserRole(u._id, 'is_vip_plus', !u.is_vip_plus)} className={`px-2 py-0.5 rounded-full text-xs transition-colors ${u.is_vip_plus ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-500/20 text-gray-400 hover:bg-purple-500/10'}`}>
                        {u.is_vip_plus ? 'VIP+' : '-'}
                      </button>
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                      <button onClick={() => updateUserRole(u._id, 'is_uploader', !u.is_uploader)} className="text-xs text-muted-foreground hover:text-blue-400" title="Toggle uploader">UP</button>
                      <button onClick={() => deleteUser(u._id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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

      {tab === 'modules' && (
        <div className="bg-card border border-border rounded-xl p-6" data-testid="admin-modules">
          <h2 className="text-xl font-bold mb-4">Modules de la page d'accueil</h2>
          <p className="text-sm text-muted-foreground mb-6">Activez ou desactivez les sections de la page d'accueil</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(moduleLabels).map(([key, label]) => (
              <button key={key} onClick={() => toggleModule(key)}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${modules[key] ? 'border-green-500/30 bg-green-500/10' : 'border-border bg-secondary/30'}`}>
                <span className="text-sm font-medium">{label}</span>
                {modules[key] ? <Eye className="w-4 h-4 text-green-400" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
              </button>
            ))}
          </div>
        </div>
      )}

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
                    <div>
                      <p className="font-medium">{r.name}</p>
                      <p className="text-sm text-muted-foreground">{r.movie_title} - {r.date} a {r.time}</p>
                    </div>
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
    </div>
  );
}
