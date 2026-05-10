import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Sparkles, Mail, Lock, User, UserPlus, Eye, EyeOff, Check } from 'lucide-react';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const pwdChecks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    digit: /\d/.test(password),
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!pwdChecks.length || !pwdChecks.upper || !pwdChecks.digit) {
      setError('Le mot de passe doit faire au moins 8 caractères, contenir 1 majuscule et 1 chiffre');
      return;
    }
    setLoading(true);
    try {
      await signUp(username, email, password);
      toast({ title: 'Compte créé !', description: `Bienvenue ${username} !` });
      navigate('/');
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : Array.isArray(detail) ? detail.map(d => d.msg || JSON.stringify(d)).join(' ') : "Erreur d'inscription");
    } finally { setLoading(false); }
  };

  return (
    <div className="relative min-h-[90vh] text-white" style={{ background: 'linear-gradient(180deg, #050b18 0%, #0a0f1c 30%, #050b18 100%)' }} data-testid="register-page">
      {/* Animated background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-32 -left-32 w-[40rem] h-[40rem] rounded-full opacity-30 blur-3xl"
          style={{ background: 'radial-gradient(closest-side, rgba(16,185,129,0.55), transparent 70%)', animation: 'pulse 8s ease-in-out infinite' }} />
        <div className="absolute top-40 -right-40 w-[36rem] h-[36rem] rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(closest-side, rgba(6,182,212,0.55), transparent 70%)', animation: 'pulse 10s ease-in-out infinite' }} />
        <div className="absolute bottom-0 left-1/3 w-[32rem] h-[32rem] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(closest-side, rgba(168,85,247,0.55), transparent 70%)', animation: 'pulse 12s ease-in-out infinite' }} />
      </div>

      <div className="relative container mx-auto px-4 py-12 md:py-20 flex items-center justify-center min-h-[90vh]">
        <div className="w-full max-w-md">
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-emerald-500/20 via-cyan-500/10 to-purple-500/20 blur-2xl pointer-events-none" />

          <div className="relative rounded-3xl border border-white/10 bg-[#0b1220]/85 backdrop-blur-xl p-7 md:p-9 shadow-2xl shadow-black/50 overflow-hidden">
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

            <div className="relative">
              <div className="text-center mb-7">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-4">
                  <Sparkles className="w-3 h-3" />Rejoins-nous
                </span>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-[1.1]">
                  <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #fff 0%, #6ee7b7 50%, #67e8f9 100%)' }}>
                    Inscription
                  </span>
                </h1>
                <p className="text-slate-400 text-sm mt-2">Crée ton compte <span className="text-white font-semibold">WaveWatch</span> en 30 secondes</p>
              </div>

              {error && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl p-3 mb-4 text-sm flex items-start gap-2" data-testid="register-error">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 block mb-2 flex items-center gap-1.5">
                    <span className="w-1 h-3 rounded-full bg-emerald-400" />Nom d'utilisateur
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      required
                      placeholder="ton pseudo"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/[0.07] focus:bg-white/[0.07] text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 transition-all"
                      data-testid="register-username"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 block mb-2 flex items-center gap-1.5">
                    <span className="w-1 h-3 rounded-full bg-cyan-400" />Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="ton@email.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/[0.07] focus:bg-white/[0.07] text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                      data-testid="register-email"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 block mb-2 flex items-center gap-1.5">
                    <span className="w-1 h-3 rounded-full bg-purple-400" />Mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/[0.07] focus:bg-white/[0.07] text-sm text-white placeholder-slate-500 outline-none focus:border-purple-400/60 focus:ring-2 focus:ring-purple-400/20 transition-all"
                      data-testid="register-password"
                    />
                    <button type="button" onClick={() => setShowPwd(s => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors" data-testid="register-toggle-password">
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password checks */}
                  {password.length > 0 && (
                    <div className="mt-2 grid grid-cols-3 gap-1.5">
                      {[
                        { ok: pwdChecks.length, label: '8 car.' },
                        { ok: pwdChecks.upper,  label: '1 maj.' },
                        { ok: pwdChecks.digit,  label: '1 chiffre' },
                      ].map(c => (
                        <div key={c.label} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border transition-colors ${c.ok ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300' : 'bg-white/5 border-white/10 text-slate-500'}`}>
                          <Check className={`w-3 h-3 flex-shrink-0 ${c.ok ? 'opacity-100' : 'opacity-30'}`} />{c.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  data-testid="register-submit"
                >
                  <UserPlus className="w-4 h-4" />
                  {loading ? 'Création...' : "S'inscrire gratuitement"}
                </button>
              </form>

              <div className="relative my-6 flex items-center gap-3">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">ou</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <p className="text-center text-sm text-slate-400">
                Déjà un compte ?{' '}
                <Link to="/login" className="font-bold bg-clip-text text-transparent hover:underline" style={{ backgroundImage: 'linear-gradient(135deg, #6ee7b7, #67e8f9)' }} data-testid="register-to-login">
                  Connexion
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
