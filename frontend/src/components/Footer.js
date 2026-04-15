import React from 'react';
import { Link } from 'react-router-dom';
import { Star, MessageSquare, Mail, ChevronLeft, ChevronRight, Crown, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import API from '../lib/api';

function UserBadge({ review }) {
  if (review.is_admin) return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">Admin</span>;
  if (review.is_uploader) return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">Uploader</span>;
  if (review.is_vip_plus) return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">VIP+</span>;
  if (review.is_vip) return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">VIP</span>;
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

  const navStyle = { backgroundColor: 'hsl(var(--nav-bg))', borderColor: 'hsl(var(--nav-border))' };
  const textStyle = { color: 'hsl(var(--nav-text))' };
  const textSecStyle = { color: 'hsl(var(--nav-text-secondary))' };

  return (
    <footer className="border-t mt-20" style={navStyle} data-testid="main-footer">
      <div className="container mx-auto px-4 py-8">
        {reviewData.total_votes > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-center" style={textStyle}>Avis de la communaute</h3>
            <p className="text-sm text-center mb-4" style={textSecStyle}>Notes moyennes basees sur {reviewData.total_votes} votes</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Contenu', val: reviewData.averages.contenu, color: 'text-yellow-400' },
                { label: 'Fonctionnalites', val: reviewData.averages.fonctionnalites, color: 'text-blue-400' },
                { label: 'Design', val: reviewData.averages.design, color: 'text-purple-400' },
              ].map(s => (
                <div key={s.label} className="bg-secondary/50 rounded-lg p-4 text-center border border-border">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Star className={`w-5 h-5 ${s.color} fill-current`} />
                    <span className="text-sm font-medium text-muted-foreground">{s.label}</span>
                  </div>
                  <div className="text-2xl font-bold" style={textStyle}>{s.val}/10</div>
                  <p className="text-xs text-muted-foreground">{reviewData.total_votes} votes</p>
                </div>
              ))}
            </div>
            {messagesWithText.length > 0 && (
              <div className="bg-secondary/30 rounded-lg p-6 border border-border">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-green-400" />
                    <span className="text-sm text-muted-foreground">Livre d'or ({idx + 1}/{messagesWithText.length})</span>
                  </div>
                  {messagesWithText.length > 1 && (
                    <div className="flex gap-2">
                      <button onClick={() => { setFade(false); setTimeout(() => { setIdx(p => (p - 1 + messagesWithText.length) % messagesWithText.length); setFade(true); }, 300); }} className="p-1 rounded hover:bg-secondary"><ChevronLeft className="w-4 h-4 text-muted-foreground" /></button>
                      <button onClick={() => { setFade(false); setTimeout(() => { setIdx(p => (p + 1) % messagesWithText.length); setFade(true); }, 300); }} className="p-1 rounded hover:bg-secondary"><ChevronRight className="w-4 h-4 text-muted-foreground" /></button>
                    </div>
                  )}
                </div>
                {messagesWithText[idx] && (
                  <div className={`transition-opacity duration-300 ${fade ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                          {messagesWithText[idx].username?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-blue-400">{messagesWithText[idx].username}</span>
                            <UserBadge review={messagesWithText[idx]} />
                            <span className="text-xs text-muted-foreground">{new Date(messagesWithText[idx].created_at).toLocaleDateString('fr-FR')}</span>
                          </div>
                          <p className="text-sm text-muted-foreground italic">"{messagesWithText[idx].message}"</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div><Link to="/"><img src="https://i.imgur.com/yY5KJ9t.png" alt="WaveWatch" className="h-12 w-auto object-contain" /></Link><p className="text-sm mt-1" style={textSecStyle}>Votre plateforme de streaming premium</p></div>
          <div className="flex items-center gap-6">
            {[{ to: '/contact-staff', label: 'Ecrire au staff', icon: <Mail className="w-4 h-4 mr-1" /> }, { to: '/dns-vpn', label: 'DNS & VPN' }, { to: '/faq', label: 'FAQ' }, { to: '/changelogs', label: 'Nouveautes' }].map(l => (
              <Link key={l.to} to={l.to} className="text-sm hover:text-blue-400 transition-colors flex items-center" style={textSecStyle}>{l.icon}{l.label}</Link>
            ))}
          </div>
        </div>
        <div className="border-t mt-6 pt-6 text-center" style={{ borderColor: 'hsl(var(--nav-border))' }}>
          <p className="text-sm" style={textSecStyle}>&copy; {new Date().getFullYear()} WaveWatch. Tous droits reserves.</p>
        </div>
      </div>
    </footer>
  );
}
