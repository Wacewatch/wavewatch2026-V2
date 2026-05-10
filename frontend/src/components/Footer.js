import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, MessageSquare, Mail, ChevronLeft, ChevronRight, Sparkles, Crown, Shield, HelpCircle, Newspaper, ShieldQuestion } from 'lucide-react';
import API from '../lib/api';

function UserBadge({ review }) {
  const cls = 'text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border backdrop-blur-sm';
  if (review.is_admin)    return <span className={`${cls} bg-rose-500/20 text-rose-300 border-rose-500/40`}><Shield className="w-2.5 h-2.5" />Admin</span>;
  if (review.is_uploader) return <span className={`${cls} bg-blue-500/20 text-blue-300 border-blue-500/40`}><Sparkles className="w-2.5 h-2.5" />Uploader</span>;
  if (review.is_vip_plus) return <span className={`${cls} bg-purple-500/20 text-purple-300 border-purple-500/40`}><Crown className="w-2.5 h-2.5" />VIP+</span>;
  if (review.is_vip)      return <span className={`${cls} bg-amber-500/20 text-amber-300 border-amber-500/40`}><Crown className="w-2.5 h-2.5" />VIP</span>;
  return null;
}

export default function Footer() {
  const [reviewData, setReviewData] = useState({ averages: { contenu: 0, fonctionnalites: 0, design: 0 }, total_votes: 0, reviews: [] });
  const [idx, setIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    API.get('/api/platform-reviews').then(({ data }) => setReviewData(data)).catch(() => {});
  }, []);

  const messagesWithText = reviewData.reviews.filter(r => r.message && r.message.trim());

  useEffect(() => {
    if (messagesWithText.length > 1) {
      const iv = setInterval(() => { setFade(false); setTimeout(() => { setIdx(p => (p + 1) % messagesWithText.length); setFade(true); }, 300); }, 6000);
      return () => clearInterval(iv);
    }
  }, [messagesWithText.length]);

  const links = [
    { to: '/contact-staff', label: 'Écrire au staff', icon: Mail },
    { to: '/dns-vpn',       label: 'DNS & VPN',       icon: ShieldQuestion },
    { to: '/faq',           label: 'FAQ',             icon: HelpCircle },
    { to: '/changelogs',    label: 'Nouveautés',      icon: Newspaper },
  ];

  return (
    <footer className="relative mt-20 text-white border-t border-white/10 overflow-hidden" style={{ background: 'linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--card) / 0.7) 50%, hsl(var(--background)) 100%)' }} data-testid="main-footer">
      {/* Decorative orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -left-32 w-[36rem] h-[36rem] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(closest-side, hsl(var(--primary) / 0.4), transparent 70%)', animation: 'pulse 12s ease-in-out infinite' }} />
        <div className="absolute -top-32 right-0 w-[32rem] h-[32rem] rounded-full opacity-15 blur-3xl"
          style={{ background: 'radial-gradient(closest-side, hsl(var(--ring) / 0.4), transparent 70%)', animation: 'pulse 14s ease-in-out infinite' }} />
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      </div>

      <div className="relative container mx-auto px-4 py-10">
        {/* Reviews block */}
        {reviewData.total_votes > 0 && (
          <div className="mb-10">
            <div className="text-center mb-6">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[11px] font-bold uppercase tracking-wider mb-3">
                <Sparkles className="w-3 h-3" />Communauté
              </span>
              <h3 className="text-2xl md:text-3xl font-black tracking-tight">
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #fff, #6ee7b7, #67e8f9)' }}>
                  Avis de la communauté
                </span>
              </h3>
              <p className="text-sm text-slate-400 mt-1">Notes moyennes basées sur <span className="text-white font-semibold">{reviewData.total_votes}</span> votes</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-6">
              {[
                { label: 'Contenu',          val: reviewData.averages.contenu,          hex: '#f59e0b' },
                { label: 'Fonctionnalités',  val: reviewData.averages.fonctionnalites,  hex: '#3b82f6' },
                { label: 'Design',           val: reviewData.averages.design,           hex: '#a855f7' },
              ].map(s => (
                <div key={s.label} className="relative overflow-hidden rounded-2xl border border-white/10 bg-card/80 backdrop-blur-xl px-5 py-4 group hover:border-white/25 transition-colors">
                  <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full blur-2xl opacity-40 group-hover:opacity-70 transition-opacity" style={{ background: s.hex }} />
                  <div className="relative flex items-center justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-widest font-semibold text-slate-400 mb-1">{s.label}</p>
                      <p className="text-3xl font-black tabular-nums" style={{ color: s.hex }}>
                        {s.val}<span className="text-slate-500 text-base">/10</span>
                      </p>
                    </div>
                    <Star className="w-7 h-7 fill-current" style={{ color: s.hex }} />
                  </div>
                </div>
              ))}
            </div>

            {messagesWithText.length > 0 && (
              <div className="relative rounded-2xl border border-white/10 bg-card/80 backdrop-blur-xl p-5 md:p-6 overflow-hidden">
                <div className="absolute -top-10 left-1/3 w-48 h-48 rounded-full blur-3xl opacity-20" style={{ background: 'radial-gradient(closest-side, rgba(16,185,129,0.6), transparent 70%)' }} />

                <div className="relative flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                      <MessageSquare className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Livre d'or</p>
                      <p className="text-[11px] text-slate-400">{idx + 1} / {messagesWithText.length}</p>
                    </div>
                  </div>
                  {messagesWithText.length > 1 && (
                    <div className="flex gap-2">
                      <button onClick={() => { setFade(false); setTimeout(() => { setIdx(p => (p - 1 + messagesWithText.length) % messagesWithText.length); setFade(true); }, 300); }}
                        className="p-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 transition-colors" data-testid="footer-review-prev">
                        <ChevronLeft className="w-4 h-4 text-slate-300" />
                      </button>
                      <button onClick={() => { setFade(false); setTimeout(() => { setIdx(p => (p + 1) % messagesWithText.length); setFade(true); }, 300); }}
                        className="p-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 transition-colors" data-testid="footer-review-next">
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                      </button>
                    </div>
                  )}
                </div>

                {messagesWithText[idx] && (
                  <div className={`relative transition-opacity duration-300 ${fade ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-black flex-shrink-0 ring-2 ring-white/10 shadow-lg">
                          {messagesWithText[idx].username?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-bold text-cyan-300">{messagesWithText[idx].username}</span>
                            <UserBadge review={messagesWithText[idx]} />
                            <span className="text-[11px] text-slate-500">{new Date(messagesWithText[idx].created_at).toLocaleDateString('fr-FR')}</span>
                          </div>
                          <p className="text-sm text-slate-300 italic leading-relaxed">"{messagesWithText[idx].message}"</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Brand + links */}
        <div className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-xl p-5 md:p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-5 text-center md:text-left">
            <Link to="/" className="flex items-center gap-3 group" data-testid="footer-logo">
              <img src="https://i.imgur.com/yY5KJ9t.png" alt="WaveWatch" className="h-12 w-auto object-contain transition-transform group-hover:scale-105" />
              <div>
                <p className="text-sm font-black bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #fff, #67e8f9, #a78bfa)' }}>WaveWatch</p>
                <p className="text-[11px] text-slate-400">Plateforme de streaming premium</p>
              </div>
            </Link>

            <div className="flex flex-wrap items-center justify-center gap-2">
              {links.map(l => {
                const I = l.icon;
                return (
                  <Link
                    key={l.to}
                    to={l.to}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:border-cyan-400/40 hover:text-cyan-300 text-slate-300 text-xs font-semibold transition-all"
                    data-testid={`footer-link-${l.to.replace('/', '')}`}
                  >
                    <I className="w-3.5 h-3.5" />{l.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 pt-6 border-t border-white/10 text-center">
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} <span className="text-slate-300 font-semibold">WaveWatch</span>. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
