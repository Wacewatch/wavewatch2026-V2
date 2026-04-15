import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate, Link } from 'react-router-dom';
import API from '../lib/api';
import { User, Save, Camera, Calendar, MapPin, Edit, Crown, Shield, Mail, X, Lock, MessageSquare, ArrowLeft, Trash2, Palette } from 'lucide-react';

export default function ProfilePage() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme, THEMES, LIMITED_THEMES, PREMIUM_THEMES } = useTheme();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    username: '', bio: '', location: '', birth_date: '', avatar_url: '',
    show_adult_content: false, auto_mark_watched: false, hide_spoilers: false,
    hide_watched_content: false, allow_messages: true
  });

  // Password
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [changingPw, setChangingPw] = useState(false);

  // Activation code
  const [activationCode, setActivationCode] = useState('');
  const [activating, setActivating] = useState(false);

  useEffect(() => { if (!authLoading && !user) navigate('/login'); }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      setProfile(p => ({
        ...p,
        username: user.username || '',
        bio: user.bio || '',
        location: user.location || '',
        birth_date: user.birth_date || '',
        avatar_url: user.avatar_url || '',
        show_adult_content: user.show_adult_content || false,
        auto_mark_watched: user.auto_mark_watched || false,
        hide_spoilers: user.hide_spoilers || false,
        hide_watched_content: user.hide_watched_content || false,
        allow_messages: user.allow_messages !== false,
      }));
    }
  }, [user]);

  if (authLoading || !user) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await API.put('/api/user/profile', profile);
      await refreshUser();
      toast({ title: 'Profil mis a jour' });
      setIsEditing(false);
    } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const handlePreferenceToggle = async (key, value) => {
    setProfile(p => ({ ...p, [key]: value }));
    try {
      await API.put('/api/user/profile', { [key]: value });
      await refreshUser();
      toast({ title: 'Preference mise a jour' });
    } catch {
      setProfile(p => ({ ...p, [key]: !value }));
      toast({ title: 'Erreur', variant: 'destructive' });
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.new_password !== passwordForm.confirm) {
      toast({ title: 'Les mots de passe ne correspondent pas', variant: 'destructive' }); return;
    }
    if (passwordForm.new_password.length < 6) {
      toast({ title: 'Minimum 6 caracteres', variant: 'destructive' }); return;
    }
    setChangingPw(true);
    try {
      await API.put('/api/user/change-password', { new_password: passwordForm.new_password, current_password: passwordForm.current_password });
      toast({ title: 'Mot de passe modifie' });
      setPasswordForm({ current_password: '', new_password: '', confirm: '' });
    } catch (err) { toast({ title: err?.response?.data?.detail || 'Erreur', variant: 'destructive' }); }
    finally { setChangingPw(false); }
  };

  const handleActivateCode = async () => {
    if (!activationCode.trim()) return;
    setActivating(true);
    try {
      const { data } = await API.post('/api/user/activate-code', { code: activationCode });
      toast({ title: data.message || 'Code active !' });
      setActivationCode('');
      await refreshUser();
    } catch (err) { toast({ title: err?.response?.data?.detail || 'Code invalide', variant: 'destructive' }); }
    finally { setActivating(false); }
  };

  const handleRemovePrivileges = async () => {
    if (!window.confirm('Supprimer tous vos privileges ?')) return;
    try {
      await API.post('/api/user/remove-privileges');
      toast({ title: 'Privileges supprimes' });
      await refreshUser();
    } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('ATTENTION: Supprimer definitivement votre compte ?')) return;
    try {
      await API.delete('/api/user/account');
      toast({ title: 'Compte supprime' });
      window.location.href = '/';
    } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
  };

  const getRoleBadge = () => {
    if (user.is_admin) return <span className="px-3 py-1 rounded-full text-sm bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1"><Shield className="w-3 h-3" />Admin</span>;
    if (user.is_uploader) return <span className="px-3 py-1 rounded-full text-sm bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1"><Shield className="w-3 h-3" />Uploader</span>;
    if (user.is_vip_plus) return <span className="px-3 py-1 rounded-full text-sm bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center gap-1"><Crown className="w-3 h-3" />VIP+</span>;
    if (user.is_vip) return <span className="px-3 py-1 rounded-full text-sm bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 flex items-center gap-1"><Crown className="w-3 h-3" />VIP</span>;
    return <span className="px-3 py-1 rounded-full text-sm bg-gray-500/20 text-gray-400 border border-gray-500/30">Membre</span>;
  };

  const hasPremiumAccess = user.is_admin || user.is_vip || user.is_vip_plus;

  const PreferenceToggle = ({ id, label, description, checked, onChange }) => (
    <div className="flex items-center justify-between py-3">
      <div className="space-y-0.5">
        <label htmlFor={id} className="text-sm font-medium">{label}</label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <input id={id} type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500" data-testid={`pref-${id}`} />
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 space-y-8" data-testid="profile-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2"><ArrowLeft className="w-4 h-4" />Retour au dashboard</Link>
          <h1 className="text-3xl font-bold">Mon Profil</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-blue-400 font-medium">{user.username}</span>
            {getRoleBadge()}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsEditing(!isEditing)} className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-secondary flex items-center gap-2">
            {isEditing ? <><X className="w-4 h-4" />Annuler</> : <><Edit className="w-4 h-4" />Modifier</>}
          </button>
          {isEditing && (
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2">
              <Save className="w-4 h-4" />{saving ? 'Enregistrement...' : 'Sauvegarder'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><User className="w-5 h-5" />Informations personnelles</h2>
            <div className="flex items-start gap-6 mb-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                  {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : user.username?.charAt(0).toUpperCase()}
                </div>
                {isEditing && (
                  <div className="mt-2"><input type="text" placeholder="URL avatar" value={profile.avatar_url} onChange={e => setProfile(p => ({ ...p, avatar_url: e.target.value }))} className="w-full text-xs px-2 py-1 rounded border border-input bg-background outline-none" /></div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-blue-400">{user.username}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1"><Mail className="w-4 h-4" />{user.email}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1"><Calendar className="w-4 h-4" />Membre depuis {new Date(user.created_at || Date.now()).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Nom d'utilisateur</label>
                <input type="text" value={profile.username} onChange={e => setProfile(p => ({ ...p, username: e.target.value }))} disabled={!isEditing}
                  className={`w-full mt-1 px-3 py-2 rounded-lg border outline-none text-sm ${isEditing ? 'border-input bg-background' : 'border-border bg-muted opacity-60'}`} data-testid="profile-username" />
              </div>
              <div>
                <label className="text-sm font-medium">Date de naissance</label>
                <input type="date" value={profile.birth_date} onChange={e => setProfile(p => ({ ...p, birth_date: e.target.value }))} disabled={!isEditing}
                  className={`w-full mt-1 px-3 py-2 rounded-lg border outline-none text-sm ${isEditing ? 'border-input bg-background' : 'border-border bg-muted opacity-60'}`} />
              </div>
              <div>
                <label className="text-sm font-medium">Localisation</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" placeholder="Ville, Pays" value={profile.location} onChange={e => setProfile(p => ({ ...p, location: e.target.value }))} disabled={!isEditing}
                    className={`w-full mt-1 pl-9 pr-3 py-2 rounded-lg border outline-none text-sm ${isEditing ? 'border-input bg-background' : 'border-border bg-muted opacity-60'}`} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <input type="email" value={user.email} disabled className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-muted opacity-60 text-sm" />
              </div>
            </div>
            <div className="mt-4">
              <label className="text-sm font-medium">Biographie</label>
              <textarea value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} disabled={!isEditing} rows={3} placeholder="Parlez-nous de vous..."
                className={`w-full mt-1 px-3 py-2 rounded-lg border outline-none text-sm ${isEditing ? 'border-input bg-background' : 'border-border bg-muted opacity-60'}`} />
            </div>
          </div>

          {/* Themes */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Palette className="w-5 h-5 text-purple-400" />Themes</h2>
            <p className="text-sm text-muted-foreground mb-4">Choisissez votre theme prefere</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {THEMES.map(t => (
                <button key={t.id} onClick={() => { setTheme(t.id); toast({ title: `Theme ${t.name} applique` }); }}
                  className={`p-2 rounded-lg border text-xs font-medium text-center transition-all ${theme === t.id ? 'border-primary bg-primary/10 ring-2 ring-primary' : 'border-border hover:border-primary/50'}`}
                  data-testid={`theme-${t.id}`}>
                  <div className="w-6 h-6 rounded-full mx-auto mb-1" style={{ background: t.preview || '#333' }} />
                  {t.name}
                </button>
              ))}
            </div>
            {LIMITED_THEMES?.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-yellow-400 mb-2">Themes VIP</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {LIMITED_THEMES.map(t => (
                    <button key={t.id} onClick={() => {
                      if (!hasPremiumAccess) { toast({ title: 'Theme VIP requis', variant: 'destructive' }); return; }
                      setTheme(t.id); toast({ title: `Theme ${t.name} applique` });
                    }}
                      className={`p-2 rounded-lg border text-xs font-medium text-center transition-all ${theme === t.id ? 'border-yellow-500 bg-yellow-500/10' : 'border-border hover:border-yellow-500/50'} ${!hasPremiumAccess ? 'opacity-50' : ''}`}>
                      <div className="w-6 h-6 rounded-full mx-auto mb-1" style={{ background: t.preview || '#855' }} />
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* VIP Status */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Crown className="w-5 h-5 text-yellow-400" />Statut</h2>
            <div className="text-center space-y-3">
              <div className="text-lg">{getRoleBadge()}</div>
              <p className="text-sm text-muted-foreground">
                {user.is_admin ? 'Tous les privileges administrateur' : user.is_vip || user.is_vip_plus ? 'Merci de votre soutien !' : 'Devenez VIP pour debloquer des themes et fonctionnalites'}
              </p>
              {!user.is_vip && !user.is_admin && (
                <Link to="/subscription" className="inline-block px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Devenir VIP</Link>
              )}
            </div>
          </div>

          {/* Content Preferences */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Shield className="w-5 h-5 text-orange-400" />Preferences de contenu</h2>
            <div className="divide-y divide-border">
              <PreferenceToggle id="adult-content" label="Contenu adulte" description="Afficher le contenu reserve aux adultes" checked={profile.show_adult_content} onChange={v => handlePreferenceToggle('show_adult_content', v)} />
              <PreferenceToggle id="hide-watched" label="Masquer le contenu vu" description="Masquer le contenu deja visionne" checked={profile.hide_watched_content} onChange={v => handlePreferenceToggle('hide_watched_content', v)} />
              <PreferenceToggle id="auto-mark" label="Marquage automatique" description="Marquer automatiquement comme vu" checked={profile.auto_mark_watched} onChange={v => handlePreferenceToggle('auto_mark_watched', v)} />
              <PreferenceToggle id="hide-spoilers" label="Mode anti-spoiler" description="Masquer les synopsis sensibles" checked={profile.hide_spoilers} onChange={v => handlePreferenceToggle('hide_spoilers', v)} />
            </div>
          </div>

          {/* Messaging Preferences */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-blue-400" />Messagerie</h2>
            <PreferenceToggle id="allow-msg" label="Recevoir des messages" description="Permettre aux autres de vous envoyer des messages" checked={profile.allow_messages} onChange={v => handlePreferenceToggle('allow_messages', v)} />
            <Link to="/contact-staff" className="block mt-2 text-center px-4 py-2 rounded-lg border border-border text-sm hover:bg-secondary">Gerer mes messages</Link>
          </div>

          {/* Password */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Lock className="w-5 h-5 text-red-400" />Securite</h2>
            <div className="space-y-3">
              <input type="password" placeholder="Nouveau mot de passe" value={passwordForm.new_password} onChange={e => setPasswordForm(p => ({ ...p, new_password: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background outline-none text-sm" />
              <input type="password" placeholder="Confirmer" value={passwordForm.confirm} onChange={e => setPasswordForm(p => ({ ...p, confirm: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background outline-none text-sm" />
              <button onClick={handlePasswordChange} disabled={changingPw} className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2">
                <Lock className="w-4 h-4" />{changingPw ? 'Modification...' : 'Changer le mot de passe'}
              </button>
            </div>
          </div>

          {/* Activation Code */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Crown className="w-5 h-5 text-yellow-400" />Code d'activation</h2>
            <div className="space-y-3">
              <input type="password" placeholder="Entrez votre code" value={activationCode} onChange={e => setActivationCode(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background outline-none text-sm" data-testid="activation-code" />
              <button onClick={handleActivateCode} disabled={activating || !activationCode.trim()} className="w-full px-4 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium">
                {activating ? 'Activation...' : 'Activer'}
              </button>
              {(user.is_vip || user.is_vip_plus || user.is_admin) && (
                <button onClick={handleRemovePrivileges} className="w-full px-4 py-2 rounded-lg border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10">
                  Supprimer tous les privileges
                </button>
              )}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
            <h2 className="text-lg font-bold mb-3 text-red-400">Zone dangereuse</h2>
            <p className="text-xs text-red-300 mb-3">Cette action supprimera definitivement votre compte et toutes vos donnees.</p>
            <button onClick={handleDeleteAccount} className="w-full px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium flex items-center justify-center gap-2">
              <Trash2 className="w-4 h-4" />Supprimer mon compte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
