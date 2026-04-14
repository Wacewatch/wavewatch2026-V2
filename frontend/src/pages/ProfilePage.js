import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import API from '../lib/api';
import { User, Save } from 'lucide-react';

export default function ProfilePage() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [username, setUsername] = useState(user?.username || '');
  const [saving, setSaving] = useState(false);

  if (!authLoading && !user) { navigate('/login'); return null; }
  if (authLoading || !user) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await API.put('/api/user/profile', { username });
      await refreshUser();
      toast({ title: 'Profil mis a jour' });
    } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl" data-testid="profile-page">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-3"><User className="w-8 h-8" />Mon Profil</h1>
      <div className="bg-card border border-border rounded-xl p-6">
        <form onSubmit={handleSave} className="space-y-6">
          <div><label className="text-sm font-medium block mb-1.5">Nom d'utilisateur</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background outline-none focus:ring-2 focus:ring-ring" data-testid="profile-username" /></div>
          <div><label className="text-sm font-medium block mb-1.5">Email</label>
            <input type="email" value={user.email} disabled className="w-full px-4 py-2.5 rounded-lg border border-input bg-muted opacity-60" /></div>
          <div><label className="text-sm font-medium block mb-1.5">Statut</label>
            <span className={`inline-block px-3 py-1 rounded-full text-sm ${user.is_admin ? 'bg-red-500/20 text-red-400' : user.is_vip ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-400'}`}>
              {user.is_admin ? 'Administrateur' : user.is_vip_plus ? 'VIP Plus' : user.is_vip ? 'VIP' : 'Membre Standard'}
            </span></div>
          <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2" data-testid="profile-save">
            <Save className="w-4 h-4" />{saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </form>
      </div>
    </div>
  );
}
