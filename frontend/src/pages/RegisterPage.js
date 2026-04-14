import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Le mot de passe doit contenir au moins 6 caracteres'); return; }
    setLoading(true);
    try {
      await signUp(username, email, password);
      toast({ title: 'Compte cree !', description: `Bienvenue ${username} !` });
      navigate('/');
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : Array.isArray(detail) ? detail.map(d => d.msg || JSON.stringify(d)).join(' ') : "Erreur d'inscription");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4" data-testid="register-page">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
          <h1 className="text-3xl font-bold text-center mb-2">Inscription</h1>
          <p className="text-muted-foreground text-center mb-8">Creez votre compte WaveWatch</p>
          {error && <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-3 mb-4 text-sm" data-testid="register-error">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="text-sm font-medium block mb-1.5">Nom d'utilisateur</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} required className="w-full px-4 py-2.5 rounded-lg border border-input bg-background outline-none focus:ring-2 focus:ring-ring" data-testid="register-username" /></div>
            <div><label className="text-sm font-medium block mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-4 py-2.5 rounded-lg border border-input bg-background outline-none focus:ring-2 focus:ring-ring" data-testid="register-email" /></div>
            <div><label className="text-sm font-medium block mb-1.5">Mot de passe</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-4 py-2.5 rounded-lg border border-input bg-background outline-none focus:ring-2 focus:ring-ring" data-testid="register-password" /></div>
            <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50" data-testid="register-submit">
              {loading ? 'Inscription...' : "S'inscrire"}
            </button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-6">Deja un compte ? <Link to="/login" className="text-primary font-medium hover:underline">Connexion</Link></p>
        </div>
      </div>
    </div>
  );
}
