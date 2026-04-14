import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import API from '../lib/api';
import { MessageSquare, ThumbsUp, Plus } from 'lucide-react';

export default function ContentRequestsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('movie');
  const [desc, setDesc] = useState('');

  useEffect(() => { loadRequests(); }, []);
  const loadRequests = () => { API.get('/api/content-requests').then(({ data }) => setRequests(data.requests || [])).catch(() => {}); };

  const submit = async (e) => {
    e.preventDefault();
    if (!user) { toast({ title: 'Connexion requise', variant: 'destructive' }); return; }
    try { await API.post('/api/content-requests', { title, content_type: type, description: desc }); toast({ title: 'Demande envoyee' }); setShowForm(false); setTitle(''); setDesc(''); loadRequests(); }
    catch { toast({ title: 'Erreur', variant: 'destructive' }); }
  };

  const vote = async (reqId) => {
    if (!user) { toast({ title: 'Connexion requise', variant: 'destructive' }); return; }
    try { await API.post('/api/content-requests/votes', { request_id: reqId }); toast({ title: 'Vote enregistre' }); loadRequests(); }
    catch { toast({ title: 'Deja vote', variant: 'destructive' }); }
  };

  return (
    <div className="container mx-auto px-4 py-8" data-testid="content-requests-page">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3"><MessageSquare className="w-8 h-8" />Demandes de contenu</h1>
        {user && <button onClick={() => setShowForm(true)} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground flex items-center gap-2"><Plus className="w-4 h-4" />Demander</button>}
      </div>
      {showForm && (
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <form onSubmit={submit} className="space-y-4">
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Titre du contenu" required className="w-full px-4 py-2.5 rounded-lg border border-input bg-background outline-none" />
            <select value={type} onChange={e => setType(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background outline-none">
              <option value="movie">Film</option><option value="tv">Serie</option><option value="anime">Anime</option><option value="other">Autre</option>
            </select>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description (optionnel)" rows={3} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background outline-none resize-none" />
            <div className="flex gap-2"><button type="submit" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground">Envoyer</button><button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-border">Annuler</button></div>
          </form>
        </div>
      )}
      <div className="space-y-3">
        {requests.length === 0 ? <p className="text-center py-12 text-muted-foreground">Aucune demande</p> :
          requests.map(r => (
            <div key={r._id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
              <button onClick={() => vote(r._id)} className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg hover:bg-secondary transition-colors">
                <ThumbsUp className="w-5 h-5" /><span className="text-sm font-bold">{r.votes}</span>
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2"><h3 className="font-bold">{r.title}</h3><span className="text-xs px-2 py-0.5 rounded-full bg-secondary">{r.content_type}</span></div>
                {r.description && <p className="text-sm text-muted-foreground mt-1">{r.description}</p>}
                <p className="text-xs text-muted-foreground mt-1">Par {r.username}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === 'approved' ? 'bg-green-500/20 text-green-400' : r.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                {r.status === 'approved' ? 'Approuve' : r.status === 'rejected' ? 'Rejete' : 'En attente'}
              </span>
            </div>
          ))
        }
      </div>
    </div>
  );
}
