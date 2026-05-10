import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import API from '../lib/api';
import { Mail, Send, Sparkles, MessageSquare, Inbox, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

const SUBJECTS = [
  { id: 'bug',         label: 'Bug / Problème',         hex: '#ef4444' },
  { id: 'request',     label: 'Demande de contenu',     hex: '#3b82f6' },
  { id: 'vip',         label: 'VIP / Abonnement',       hex: '#f59e0b' },
  { id: 'suggestion',  label: 'Suggestion',             hex: '#10b981' },
  { id: 'other',       label: 'Autre',                  hex: '#a855f7' },
];

export default function ContactStaffPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [category, setCategory] = useState('bug');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (user) {
      API.get('/api/staff-messages/mine').then(({ data }) => {
        setHistory(data.messages || data || []);
      }).catch(() => setHistory([]));
    }
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="relative min-h-screen flex items-center justify-center text-white" style={{ background: 'linear-gradient(180deg, #050b18 0%, #0a0f1c 30%, #050b18 100%)' }}>
        <div className="text-slate-400 animate-pulse">Chargement...</div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast({ title: 'Champs manquants', description: 'Renseigne un sujet et un message', variant: 'destructive' });
      return;
    }
    setSending(true);
    try {
      const fullSubject = `[${SUBJECTS.find(s => s.id === category)?.label || 'Autre'}] ${subject}`;
      await API.post('/api/staff-messages', { subject: fullSubject, message });
      toast({ title: 'Message envoyé', description: 'Le staff te répondra bientôt' });
      setSubject(''); setMessage('');
      // Refresh history
      API.get('/api/staff-messages/mine').then(({ data }) => setHistory(data.messages || data || [])).catch(() => {});
    } catch {
      toast({ title: 'Erreur', description: "Impossible d'envoyer le message", variant: 'destructive' });
    } finally { setSending(false); }
  };

  const charsLeft = 1000 - message.length;

  return (
    <div className="relative min-h-screen text-white" style={{ background: 'linear-gradient(180deg, #050b18 0%, #0a0f1c 30%, #050b18 100%)' }} data-testid="contact-staff-page">
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-32 -left-32 w-[40rem] h-[40rem] rounded-full opacity-30 blur-3xl"
          style={{ background: 'radial-gradient(closest-side, rgba(236,72,153,0.55), transparent 70%)', animation: 'pulse 8s ease-in-out infinite' }} />
        <div className="absolute top-40 -right-40 w-[36rem] h-[36rem] rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(closest-side, rgba(59,130,246,0.55), transparent 70%)', animation: 'pulse 10s ease-in-out infinite' }} />
        <div className="absolute bottom-0 left-1/3 w-[32rem] h-[32rem] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(closest-side, rgba(168,85,247,0.55), transparent 70%)', animation: 'pulse 12s ease-in-out infinite' }} />
      </div>

      <div className="relative container mx-auto px-4 py-8 max-w-4xl">
        {/* HERO */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 mb-8 backdrop-blur-sm" style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.18), rgba(168,85,247,0.12) 35%, rgba(59,130,246,0.18) 65%, rgba(6,182,212,0.15))' }}>
          <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          <div className="absolute -top-20 right-10 w-72 h-72 rounded-full blur-3xl opacity-50" style={{ background: 'radial-gradient(closest-side, rgba(236,72,153,0.6), transparent 70%)' }} />

          <div className="relative px-6 md:px-12 py-10 md:py-14">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/15 border border-pink-400/30 text-pink-300 text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles className="w-3 h-3" />Support
            </span>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-3 leading-[1.05]">
              <span className="block bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #fff 0%, #f9a8d4 40%, #c4b5fd 70%, #93c5fd 100%)' }}>
                Écrire au
              </span>
              <span className="block text-white"><span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #ec4899, #a855f7, #3b82f6)' }}>Staff</span></span>
            </h1>
            <p className="text-slate-300 max-w-xl text-base md:text-lg leading-relaxed">
              Une question, un bug, une suggestion ? <span className="text-white font-semibold">On répond sous 24h</span>.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* FORM */}
          <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-[#0b1220]/80 backdrop-blur-xl p-5 md:p-6 shadow-xl shadow-black/30">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center shadow-lg shadow-pink-500/30">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Nouveau message</h2>
                <p className="text-xs text-slate-400">Connecté en tant que <span className="text-cyan-300 font-semibold">{user.username}</span></p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" data-testid="contact-staff-form">
              {/* Catégorie */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 block mb-2 flex items-center gap-1.5">
                  <span className="w-1 h-3 rounded-full bg-pink-400" />Catégorie
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SUBJECTS.map(s => {
                    const active = category === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setCategory(s.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${active ? 'text-white shadow-lg scale-105' : 'border border-white/15 bg-white/5 hover:bg-white/10 text-slate-300'}`}
                        style={active ? { background: `linear-gradient(135deg, ${s.hex}, ${s.hex}99)`, boxShadow: `0 6px 24px ${s.hex}55` } : {}}
                        data-testid={`contact-cat-${s.id}`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sujet */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 block mb-2 flex items-center gap-1.5">
                  <span className="w-1 h-3 rounded-full bg-cyan-400" />Sujet
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  required
                  maxLength={120}
                  placeholder="Décris ta demande en quelques mots"
                  className="w-full px-4 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/[0.07] focus:bg-white/[0.07] text-sm text-white placeholder-slate-500 outline-none focus:border-pink-400/60 focus:ring-2 focus:ring-pink-400/20 transition-all"
                  data-testid="contact-subject-input"
                />
              </div>

              {/* Message */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 block mb-2 flex items-center gap-1.5">
                  <span className="w-1 h-3 rounded-full bg-purple-400" />Message
                </label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value.slice(0, 1000))}
                  required
                  rows={7}
                  placeholder="Donne-nous un maximum de détails pour qu'on puisse t'aider efficacement..."
                  className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/[0.07] focus:bg-white/[0.07] text-sm text-white placeholder-slate-500 outline-none focus:border-purple-400/60 focus:ring-2 focus:ring-purple-400/20 transition-all resize-none"
                  data-testid="contact-message-input"
                />
                <p className={`text-xs mt-1 text-right ${charsLeft < 100 ? 'text-amber-400' : 'text-slate-500'}`}>
                  {charsLeft} caractères restants
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={sending || !subject.trim() || !message.trim()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:from-pink-400 hover:via-purple-400 hover:to-blue-400 text-white font-bold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                data-testid="contact-submit-btn"
              >
                <Send className="w-4 h-4" />
                {sending ? 'Envoi...' : 'Envoyer le message'}
              </button>
            </form>
          </div>

          {/* HISTORY / Info */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-[#0b1220]/80 backdrop-blur-xl p-5 shadow-xl shadow-black/30">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <Inbox className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-base font-black text-white">Mes messages</h3>
              </div>
              {history.length === 0 ? (
                <div className="text-center py-6 text-slate-400">
                  <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">Aucun message envoyé</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {history.slice(0, 8).map((m, i) => {
                    const replied = m.reply || m.replied_at;
                    return (
                      <div key={m._id || m.id || i} className="rounded-xl border border-white/10 bg-white/[0.03] p-3" data-testid={`history-msg-${i}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${replied ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40' : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'}`}>
                            {replied ? <><CheckCircle2 className="w-2.5 h-2.5" />Répondu</> : <><Clock className="w-2.5 h-2.5" />En attente</>}
                          </span>
                          <span className="text-[10px] text-slate-500">{m.created_at ? new Date(m.created_at).toLocaleDateString('fr-FR') : ''}</span>
                        </div>
                        <p className="text-xs font-bold text-white truncate">{m.subject}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/40 to-rose-950/30 p-4">
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-3xl opacity-30" style={{ background: 'rgba(245,158,11,0.5)' }} />
              <div className="relative flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-200 mb-1">Avant de nous écrire</p>
                  <p className="text-[11px] text-slate-300 leading-relaxed">Vérifie la <a href="/faq" className="text-cyan-300 underline hover:text-cyan-200">FAQ</a> — tu y trouveras peut-être déjà la réponse !</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
