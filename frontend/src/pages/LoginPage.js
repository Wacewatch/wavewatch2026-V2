import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Sparkles, Mail, Lock, LogIn, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      toast({ title: 'Connexion réussie', description: 'Bienvenue sur WaveWatch!' });
      navigate('/');
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : Array.isArray(detail) ? detail.map(d => d.msg || JSON.stringify(d)).join(' ') : 'Email ou mot de passe incorrect');
    } finally { setLoading(false); }
  };

  return (
    <div className="relative min-h-[90vh] text-white" style={{ background: 'linear-gradient(180deg, #050b18 0%, #0a0f1c 30%, #050b18 100%)' }} data-testid="login-page">
      {/* Animated background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-32 -left-32 w-[40rem] h-[40rem] rounded-full opacity-30 blur-3xl"
          style={{ background: 'radial-gradient(closest-side, rgba(6,182,212,0.55), transparent 70%)', animation: 'pulse 8s ease-in-out infinite' }} />
        <div className="absolute top-40 -right-40 w-[36rem] h-[36rem] rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(closest-side, rgba(59,130,246,0.55), transparent 70%)', animation: 'pulse 10s ease-in-out infinite' }} />
        <div className="absolute bottom-0 left-1/3 w-[32rem] h-[32rem] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(closest-side, rgba(168,85,247,0.55), transparent 70%)', animation: 'pulse 12s ease-in-out infinite' }} />
      </div>

      <div className="relative container mx-auto px-4 py-12 md:py-20 flex items-center justify-center min-h-[90vh]">
        <div className="w-full max-w-md">
          {/* Glow */}
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-purple-500/20 blur-2xl pointer-events-none" />

          {/* Card */}
          <div className="relative rounded-3xl border border-white/10 bg-[#0b1220]/85 backdrop-blur-xl p-7 md:p-9 shadow-2xl shadow-black/50 overflow-hidden">
            {/* Decorative grid */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

            <div className="relative">
              <div className="text-center mb-7">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-4">
                  <Sparkles className="w-3 h-3" />Espace membre
                </span>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-[1.1]">
                  <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #fff 0%, #67e8f9 50%, #93c5fd 100%)' }}>
                    Connexion
                  </span>
                </h1>
                <p className="text-slate-400 text-sm mt-2">Accède à ton compte <span className="text-white font-semibold">WaveWatch</span></p>
              </div>

              {error && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl p-3 mb-4 text-sm flex items-start gap-2" data-testid="login-error">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
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
                      data-testid="login-email"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 block mb-2 flex items-center gap-1.5">
                    <span className="w-1 h-3 rounded-full bg-blue-400" />Mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/[0.07] focus:bg-white/[0.07] text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                      data-testid="login-password"
                    />
                    <button type="button" onClick={() => setShowPwd(s => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors" data-testid="login-toggle-password">
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  data-testid="login-submit"
                >
                  <LogIn className="w-4 h-4" />
                  {loading ? 'Connexion...' : 'Se connecter'}
                </button>
              </form>

              <div className="relative my-6 flex items-center gap-3">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">ou</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <p className="text-center text-sm text-slate-400">
                Pas encore de compte ?{' '}
                <Link to="/register" className="font-bold bg-clip-text text-transparent hover:underline" style={{ backgroundImage: 'linear-gradient(135deg, #67e8f9, #a78bfa)' }} data-testid="login-to-register">
                  Inscription gratuite
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
