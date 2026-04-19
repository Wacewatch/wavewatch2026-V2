import React, { useEffect, useState } from 'react';
import API from '../lib/api';
import { X, Info, AlertTriangle, CheckCircle2, Megaphone, Sparkles } from 'lucide-react';

const VARIANTS = {
  info: {
    bg: 'from-blue-600/90 to-sky-600/90',
    icon: <Info className="w-5 h-5" />,
  },
  success: {
    bg: 'from-emerald-600/90 to-green-600/90',
    icon: <CheckCircle2 className="w-5 h-5" />,
  },
  warning: {
    bg: 'from-amber-600/90 to-orange-600/90',
    icon: <AlertTriangle className="w-5 h-5" />,
  },
  danger: {
    bg: 'from-red-600/90 to-rose-600/90',
    icon: <AlertTriangle className="w-5 h-5" />,
  },
  promo: {
    bg: 'from-fuchsia-600/90 to-purple-600/90',
    icon: <Sparkles className="w-5 h-5" />,
  },
  announce: {
    bg: 'from-slate-700/95 to-slate-900/95',
    icon: <Megaphone className="w-5 h-5" />,
  },
};

const STORAGE_KEY = 'wavewatch_info_banner_dismissed';

export default function InfoBanner() {
  const [banner, setBanner] = useState(null);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    API.get('/api/info-banner').then(({ data }) => {
      const b = data?.banner;
      if (!b || !b.enabled || !b.message) { setHidden(true); return; }
      // Check dismissal: persistent 24h, keyed by version
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.version === b.version && parsed.until && parsed.until > Date.now()) {
            setBanner(b); setHidden(true); return;
          }
        }
      } catch { /* ignore */ }
      setBanner(b); setHidden(false);
    }).catch(() => setHidden(true));
  }, []);

  const dismiss = () => {
    if (!banner) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        version: banner.version || 1,
        until: Date.now() + 24 * 60 * 60 * 1000,
      }));
    } catch { /* ignore */ }
    setHidden(true);
  };

  if (!banner || hidden) return null;
  const v = VARIANTS[banner.variant] || VARIANTS.info;
  const Content = (
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <span className="flex-shrink-0 text-white">{v.icon}</span>
      <p className="text-sm md:text-[15px] text-white font-medium truncate md:whitespace-normal">{banner.message}</p>
      {banner.link_url && banner.link_label && (
        <a
          href={banner.link_url}
          className="ml-2 text-xs md:text-sm font-semibold text-white underline underline-offset-2 hover:no-underline flex-shrink-0"
          target={banner.link_url.startsWith('http') ? '_blank' : undefined}
          rel="noopener noreferrer"
          data-testid="info-banner-cta"
        >
          {banner.link_label} →
        </a>
      )}
    </div>
  );

  return (
    <div
      className={`w-full bg-gradient-to-r ${v.bg} border-b border-white/10 shadow-md relative z-40`}
      data-testid="info-banner"
    >
      <div className="container mx-auto px-4 py-3 flex items-center gap-3">
        {Content}
        {(banner.dismissible !== false) && (
          <button
            onClick={dismiss}
            className="flex-shrink-0 p-1.5 rounded-full hover:bg-white/15 transition-colors text-white"
            aria-label="Fermer"
            data-testid="info-banner-close"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
