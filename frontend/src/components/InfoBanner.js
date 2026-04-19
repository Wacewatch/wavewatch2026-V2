import React, { useEffect, useState } from 'react';
import API from '../lib/api';
import { X, ExternalLink, Info, AlertTriangle, CheckCircle2, Megaphone, Sparkles } from 'lucide-react';

const VARIANTS = {
  info: {
    border: 'border-blue-500/30',
    bg: 'from-gray-900 via-gray-900 to-blue-950/30',
    badge: 'bg-blue-500 text-white',
    cta: 'bg-blue-600 hover:bg-blue-500',
    ctaBorder: 'border-blue-600/50 text-blue-400 hover:bg-blue-900/20',
    tagPrimary: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    icon: Info,
  },
  success: {
    border: 'border-emerald-500/30',
    bg: 'from-gray-900 via-gray-900 to-emerald-950/30',
    badge: 'bg-emerald-500 text-white',
    cta: 'bg-emerald-600 hover:bg-emerald-500',
    ctaBorder: 'border-emerald-600/50 text-emerald-400 hover:bg-emerald-900/20',
    tagPrimary: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    icon: CheckCircle2,
  },
  warning: {
    border: 'border-amber-500/30',
    bg: 'from-gray-900 via-gray-900 to-amber-950/30',
    badge: 'bg-amber-500 text-white',
    cta: 'bg-amber-600 hover:bg-amber-500',
    ctaBorder: 'border-amber-600/50 text-amber-400 hover:bg-amber-900/20',
    tagPrimary: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    icon: AlertTriangle,
  },
  danger: {
    border: 'border-red-500/30',
    bg: 'from-gray-900 via-gray-900 to-red-950/30',
    badge: 'bg-red-500 text-white',
    cta: 'bg-red-600 hover:bg-red-500',
    ctaBorder: 'border-red-600/50 text-red-400 hover:bg-red-900/20',
    tagPrimary: 'bg-red-500/20 text-red-400 border-red-500/30',
    icon: AlertTriangle,
  },
  promo: {
    border: 'border-fuchsia-500/30',
    bg: 'from-gray-900 via-gray-900 to-fuchsia-950/30',
    badge: 'bg-fuchsia-500 text-white',
    cta: 'bg-fuchsia-600 hover:bg-fuchsia-500',
    ctaBorder: 'border-fuchsia-600/50 text-fuchsia-400 hover:bg-fuchsia-900/20',
    tagPrimary: 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30',
    icon: Sparkles,
  },
  announce: {
    border: 'border-cyan-500/30',
    bg: 'from-gray-900 via-gray-900 to-cyan-950/30',
    badge: 'bg-cyan-500 text-white',
    cta: 'bg-cyan-600 hover:bg-cyan-500',
    ctaBorder: 'border-cyan-600/50 text-cyan-400 hover:bg-cyan-900/20',
    tagPrimary: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    icon: Megaphone,
  },
};

const STORAGE_KEY = 'wavewatch_info_panel_dismissed';

export function InfoPanelView({ banner, onDismiss, preview = false }) {
  if (!banner) return null;
  const v = VARIANTS[banner.variant] || VARIANTS.info;
  const Icon = v.icon;
  const tags = Array.isArray(banner.tags) ? banner.tags.filter(Boolean) : [];
  const isExternal = (url) => url && /^https?:\/\//i.test(url);
  const ctaUrl = banner.link_url || '';
  const ctaLabel = banner.link_label || '';
  const ctaSecondaryUrl = banner.link2_url || '';
  const ctaSecondaryLabel = banner.link2_label || '';

  return (
    <div className={`relative rounded-2xl border-2 ${v.border} bg-gradient-to-r ${v.bg} overflow-hidden`} data-testid="info-panel">
      {/* Close button */}
      {!preview && banner.dismissible !== false && (
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 z-20 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white/70 hover:text-white transition-colors"
          aria-label="Fermer"
          data-testid="info-panel-close"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 p-6 md:p-10">
        {/* Left : image or icon */}
        <div className="w-28 h-28 md:w-44 md:h-44 flex-shrink-0 flex items-center justify-center">
          {banner.image_url ? (
            <img src={banner.image_url} alt={banner.title || ''} className="w-full h-full object-contain drop-shadow-2xl" />
          ) : (
            <div className={`w-full h-full rounded-2xl bg-gradient-to-br ${v.bg} border-2 ${v.border} flex items-center justify-center`}>
              <Icon className="w-16 h-16 md:w-20 md:h-20 text-white/80" />
            </div>
          )}
        </div>

        {/* Right : content */}
        <div className="flex-1 text-center md:text-left min-w-0">
          {banner.title && (
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              {banner.title}
              {banner.badge && (
                <span className={`text-xs px-2 py-1 rounded-full ${v.badge} align-middle ml-2 font-medium`}>
                  {banner.badge}
                </span>
              )}
            </h2>
          )}
          {banner.subtitle && (
            <p className="text-muted-foreground italic mt-1">{banner.subtitle}</p>
          )}

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
              {tags.map((t, i) => (
                <span key={i} className={`px-3 py-1 rounded-full text-xs font-medium border ${v.tagPrimary}`}>{t}</span>
              ))}
            </div>
          )}

          {banner.message && (
            <p className="text-sm text-muted-foreground mt-4 max-w-2xl mx-auto md:mx-0">{banner.message}</p>
          )}

          {(ctaUrl || ctaSecondaryUrl) && (
            <div className="flex flex-col sm:flex-row gap-3 mt-5 justify-center md:justify-start">
              {ctaUrl && ctaLabel && (
                <a
                  href={ctaUrl}
                  target={isExternal(ctaUrl) ? '_blank' : undefined}
                  rel={isExternal(ctaUrl) ? 'noopener noreferrer' : undefined}
                  className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg ${v.cta} text-white font-medium transition-colors`}
                  data-testid="info-panel-cta-primary"
                >
                  {isExternal(ctaUrl) && <ExternalLink className="w-4 h-4" />}
                  {ctaLabel}
                </a>
              )}
              {ctaSecondaryUrl && ctaSecondaryLabel && (
                <a
                  href={ctaSecondaryUrl}
                  target={isExternal(ctaSecondaryUrl) ? '_blank' : undefined}
                  rel={isExternal(ctaSecondaryUrl) ? 'noopener noreferrer' : undefined}
                  className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg border ${v.ctaBorder} font-medium transition-colors text-sm`}
                  data-testid="info-panel-cta-secondary"
                >
                  {ctaSecondaryLabel}
                </a>
              )}
            </div>
          )}

          {banner.footer_text && (
            <p className="text-xs text-muted-foreground mt-3">{banner.footer_text}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InfoBanner() {
  const [banner, setBanner] = useState(null);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    API.get('/api/info-banner').then(({ data }) => {
      const b = data?.banner;
      if (!b || !b.enabled) { setHidden(true); return; }
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
  return (
    <div className="container mx-auto px-4 pt-6">
      <InfoPanelView banner={banner} onDismiss={dismiss} />
    </div>
  );
}
