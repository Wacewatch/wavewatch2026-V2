import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import API from '../lib/api';
import { MessageSquare, Send, ArrowLeft, Mail, MailOpen, User, Search } from 'lucide-react';

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState('received');
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);

  // New message
  const [showCompose, setShowCompose] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [msgContent, setMsgContent] = useState('');
  const [sending, setSending] = useState(false);
  const [users, setUsers] = useState([]);

  useEffect(() => { if (!authLoading && !user) navigate('/login'); }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      setLoading(true);
      API.get('/api/messages').then(({ data }) => {
        setReceived(data.received || []);
        setSent(data.sent || []);
      }).catch(() => {}).finally(() => setLoading(false));
    }
  }, [user]);

  const searchUsers = async (q) => {
    setRecipientSearch(q);
    if (q.length < 2) { setUsers([]); return; }
    try {
      const { data } = await API.get('/api/admin/users');
      const filtered = (data.users || []).filter(u => u.username?.toLowerCase().includes(q.toLowerCase()) && u._id !== user._id);
      setUsers(filtered.slice(0, 10));
    } catch { setUsers([]); }
  };

  const selectRecipient = (u) => {
    setRecipientId(u._id);
    setRecipientName(u.username);
    setRecipientSearch(u.username);
    setUsers([]);
  };

  const sendMessage = async () => {
    if (!recipientId || !msgContent.trim()) { toast({ title: 'Destinataire et contenu requis', variant: 'destructive' }); return; }
    setSending(true);
    try {
      await API.post('/api/messages', { recipient_id: recipientId, content: msgContent.trim() });
      toast({ title: 'Message envoye !' });
      setMsgContent('');
      setRecipientId('');
      setRecipientName('');
      setRecipientSearch('');
      setShowCompose(false);
      const { data } = await API.get('/api/messages');
      setReceived(data.received || []);
      setSent(data.sent || []);
    } catch (err) { toast({ title: err?.response?.data?.detail || 'Erreur', variant: 'destructive' }); }
    finally { setSending(false); }
  };

  const markAsRead = async (msgId) => {
    try {
      await API.put(`/api/messages/${msgId}/read`);
      setReceived(prev => prev.map(m => m._id === msgId ? { ...m, is_read: true } : m));
    } catch {}
  };

  if (authLoading || !user) return null;
  const unreadCount = received.filter(m => !m.is_read).length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl" data-testid="messages-page">
      <button onClick={() => navigate('/dashboard')} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4"><ArrowLeft className="w-4 h-4" />Retour au dashboard</button>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3"><MessageSquare className="w-8 h-8" />Messagerie</h1>
          {unreadCount > 0 && <p className="text-sm text-blue-400 mt-1">{unreadCount} message{unreadCount > 1 ? 's' : ''} non lu{unreadCount > 1 ? 's' : ''}</p>}
        </div>
        <button onClick={() => setShowCompose(!showCompose)} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2" data-testid="compose-btn">
          <Send className="w-4 h-4" />{showCompose ? 'Annuler' : 'Nouveau message'}
        </button>
      </div>

      {/* Compose */}
      {showCompose && (
        <div className="bg-card border border-border rounded-xl p-6 mb-6" data-testid="compose-form">
          <h2 className="font-bold text-lg mb-4">Nouveau message</h2>
          <div className="space-y-4">
            <div className="relative">
              <label className="text-sm font-medium">Destinataire</label>
              <div className="relative mt-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type="text" value={recipientSearch} onChange={e => searchUsers(e.target.value)} placeholder="Rechercher un utilisateur..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-background outline-none text-sm" data-testid="recipient-search" />
              </div>
              {recipientName && <p className="text-xs text-green-400 mt-1">Destinataire : {recipientName}</p>}
              {users.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-xl max-h-40 overflow-y-auto">
                  {users.map(u => (
                    <button key={u._id} onClick={() => selectRecipient(u)} className="w-full px-3 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>{u.username}</span>
                      {u.is_admin && <span className="text-[10px] px-1 py-0.5 rounded bg-red-500/20 text-red-400">Admin</span>}
                      {u.is_vip && <span className="text-[10px] px-1 py-0.5 rounded bg-yellow-500/20 text-yellow-400">VIP</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Message</label>
              <textarea value={msgContent} onChange={e => setMsgContent(e.target.value)} rows={4} placeholder="Votre message..."
                className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background outline-none text-sm" data-testid="message-content" />
            </div>
            <button onClick={sendMessage} disabled={sending || !recipientId || !msgContent.trim()} className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 flex items-center gap-2" data-testid="send-message-btn">
              <Send className="w-4 h-4" />{sending ? 'Envoi...' : 'Envoyer'}
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border mb-4">
        <button onClick={() => setTab('received')} className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${tab === 'received' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`} data-testid="tab-received">
          <Mail className="w-4 h-4" />Recus ({received.length})
          {unreadCount > 0 && <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">{unreadCount}</span>}
        </button>
        <button onClick={() => setTab('sent')} className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${tab === 'sent' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`} data-testid="tab-sent">
          <Send className="w-4 h-4" />Envoyes ({sent.length})
        </button>
      </div>

      {/* Messages List */}
      {loading ? <p className="text-center py-8 text-muted-foreground">Chargement...</p> : (
        <div className="space-y-3">
          {tab === 'received' && (received.length === 0 ? (
            <div className="text-center py-12"><Mail className="w-12 h-12 mx-auto text-muted-foreground mb-3" /><p className="text-muted-foreground">Aucun message recu</p></div>
          ) : received.map(m => (
            <div key={m._id} onClick={() => markAsRead(m._id)} className={`bg-card border rounded-xl p-4 cursor-pointer hover:border-primary/30 transition-colors ${m.is_read ? 'border-border' : 'border-blue-500/50 bg-blue-500/5'}`} data-testid={`msg-${m._id}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">{m.sender_username?.charAt(0).toUpperCase()}</div>
                  <span className="font-medium text-sm">{m.sender_username}</span>
                  {!m.is_read && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                </div>
                <span className="text-xs text-muted-foreground">{m.created_at ? new Date(m.created_at).toLocaleString('fr-FR') : ''}</span>
              </div>
              <p className="text-sm text-muted-foreground">{m.content}</p>
            </div>
          )))}
          {tab === 'sent' && (sent.length === 0 ? (
            <div className="text-center py-12"><Send className="w-12 h-12 mx-auto text-muted-foreground mb-3" /><p className="text-muted-foreground">Aucun message envoye</p></div>
          ) : sent.map(m => (
            <div key={m._id} className="bg-card border border-border rounded-xl p-4" data-testid={`sent-${m._id}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm text-green-400">Envoye a {m.recipient_id}</span>
                <span className="text-xs text-muted-foreground">{m.created_at ? new Date(m.created_at).toLocaleString('fr-FR') : ''}</span>
              </div>
              <p className="text-sm text-muted-foreground">{m.content}</p>
            </div>
          )))}
        </div>
      )}
    </div>
  );
}
