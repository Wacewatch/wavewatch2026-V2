import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import API from '../lib/api';
import { Shield, Users, BarChart3, MessageSquare, Settings, Crown, Trash2 } from 'lucide-react';

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);

  useEffect(() => { if (!authLoading && (!user || !user.is_admin)) navigate('/'); }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user?.is_admin) {
      if (tab === 'stats') API.get('/api/admin/stats').then(({ data }) => setStats(data)).catch(() => {});
      if (tab === 'users') API.get('/api/admin/users').then(({ data }) => setUsers(data.users || [])).catch(() => {});
      if (tab === 'messages') API.get('/api/staff-messages').then(({ data }) => setMessages(data.messages || [])).catch(() => {});
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

  const tabs = [
    { id: 'stats', label: 'Statistiques', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'users', label: 'Utilisateurs', icon: <Users className="w-4 h-4" /> },
    { id: 'messages', label: 'Messages', icon: <MessageSquare className="w-4 h-4" /> },
  ];

  return (
    <div className="container mx-auto px-4 py-8" data-testid="admin-page">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-3"><Shield className="w-8 h-8 text-red-400" />Administration</h1>
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${tab === t.id ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'}`}>{t.icon}{t.label}</button>
        ))}
      </div>

      {tab === 'stats' && stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[{label:'Utilisateurs',val:stats.total_users},{label:'VIP',val:stats.vip_users},{label:'Feedback',val:stats.total_feedback},{label:'Demandes',val:stats.total_requests},{label:'Playlists',val:stats.total_playlists}].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4 text-center"><p className="text-3xl font-bold">{s.val}</p><p className="text-sm text-muted-foreground">{s.label}</p></div>
          ))}
        </div>
      )}

      {tab === 'users' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border"><th className="px-4 py-3 text-left">Utilisateur</th><th className="px-4 py-3 text-left">Email</th><th className="px-4 py-3 text-left">Role</th><th className="px-4 py-3 text-left">VIP</th><th className="px-4 py-3 text-left">Actions</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id} className="border-b border-border/50 hover:bg-secondary/30">
                    <td className="px-4 py-3 font-medium">{u.username}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${u.is_admin ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'}`}>{u.is_admin ? 'Admin' : u.is_uploader ? 'Uploader' : 'User'}</span></td>
                    <td className="px-4 py-3">
                      <button onClick={() => updateUserRole(u._id, 'is_vip', !u.is_vip)} className={`px-2 py-0.5 rounded-full text-xs transition-colors ${u.is_vip ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-400 hover:bg-yellow-500/10'}`}>
                        <Crown className="w-3 h-3 inline mr-1" />{u.is_vip ? 'VIP' : 'Standard'}
                      </button>
                    </td>
                    <td className="px-4 py-3"><button onClick={() => deleteUser(u._id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'messages' && (
        <div className="space-y-4">
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
    </div>
  );
}
