import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API, { TMDB_IMG } from '../lib/api';
import ContentGrid from './ContentGrid';
import { LoadingGrid } from './Loading';
import { Download, Film, Tv, Clock, Globe } from 'lucide-react';

export function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `il y a ${d}j`;
  const w = Math.floor(d / 7);
  if (w < 5) return `il y a ${w}sem`;
  const mo = Math.floor(d / 30);
  return `il y a ${mo} mois`;
}

export function qualityColor(q) {
  const qq = (q || '').toUpperCase();
  if (qq === '4K' || qq === 'UHD') return 'bg-amber-500 text-black border-amber-400';
  if (qq === 'FHD' || qq === '1080P') return 'bg-emerald-500 text-white border-emerald-400';
  if (qq === 'HD' || qq === '720P') return 'bg-sky-500 text-white border-sky-400';
  return 'bg-slate-500 text-white border-slate-400';
}

/** Build correct internal route for a download link item */
export function linkHref(item) {
  const tid = item.tmdb_id;
  if (!tid) return '#';
  if (item.media_type === 'tv') {
    if (item.season_number != null && item.episode_number != null) {
      return `/tv-shows/${tid}/season/${item.season_number}/episode/${item.episode_number}`;
    }
    return `/tv-shows/${tid}`;
  }
  return `/movies/${tid}`;
}

export function DownloadLinkCard({ item }) {
  const poster = item.poster_path ? `${TMDB_IMG}/w342${item.poster_path}` : 'https://placehold.co/342x513/1e293b/64748b?text=%3F';
  const isTv = item.media_type === 'tv';
  const hasEpisode = isTv && item.season_number != null && item.episode_number != null;
  return (
    <Link to={linkHref(item)} className="group block" data-testid={`download-link-${item.tmdb_id}`}>
      <div className="relative overflow-hidden rounded-lg border border-border bg-card transition-transform duration-200 group-hover:scale-[1.03] group-hover:border-primary/40">
        <div className="aspect-[2/3] overflow-hidden relative">
          <img
            src={poster}
            alt={item.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => { e.target.src = 'https://placehold.co/342x513/1e293b/64748b?text=%3F'; }}
          />
          {/* Top-left quality badge - solid, highly visible */}
          {item.quality && (
            <div className={`absolute top-2 left-2 text-[11px] font-extrabold px-2 py-0.5 rounded border ${qualityColor(item.quality)} shadow-lg`}>
              {item.quality.toUpperCase()}
            </div>
          )}
          {/* Top-right media type */}
          <div className="absolute top-2 right-2 p-1 rounded bg-black/70 backdrop-blur-sm shadow-lg">
            {isTv ? <Tv className="w-3.5 h-3.5 text-white" /> : <Film className="w-3.5 h-3.5 text-white" />}
          </div>
          {/* Bottom overlay with STRONG contrast */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent pt-8 pb-2 px-2">
            {hasEpisode && (
              <div className="inline-block text-[11px] font-extrabold text-white bg-red-600 px-1.5 py-0.5 rounded mb-1">
                S{item.season_number} E{item.episode_number}
              </div>
            )}
            <p className="text-[11px] text-white flex items-center gap-1 font-medium drop-shadow">
              <Clock className="w-3 h-3" />{timeAgo(item.created_at)}
            </p>
          </div>
        </div>
        <div className="p-2">
          <p className="text-xs font-semibold truncate group-hover:text-primary transition-colors">{item.title}</p>
          <div className="flex items-center gap-1.5 mt-1 text-[10px] font-medium">
            {item.language && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                <Globe className="w-2.5 h-2.5" />{String(item.language).toUpperCase()}
              </span>
            )}
            {item.resolution && (
              <span className="px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-500/30">{item.resolution}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function DownloadLinksRow() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({ title: 'Derniers liens de téléchargement', subtitle: '', limit: 12 });

  useEffect(() => {
    API.get('/api/download-links/config').then(({ data }) => {
      if (data?.config) setConfig(data.config);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const lim = config.limit || 12;
    API.get(`/api/download-links/recent?limit=${lim}`)
      .then(({ data }) => setItems(data.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [config.limit]);

  if (loading) {
    return (
      <div className="space-y-4"><h2 className="text-xl font-bold">{config.title || 'Derniers liens de téléchargement'}</h2><LoadingGrid count={6} /></div>
    );
  }
  if (!items.length) return null;

  return (
    <ContentGrid
      title={config.title || 'Derniers liens de téléchargement'}
      subtitle={config.subtitle || undefined}
      link="/download-links"
      icon={<Download className="w-5 h-5 text-emerald-400" />}
    >
      {items.map(it => (
        <DownloadLinkCard key={`${it.media_type}-${it.tmdb_id}-${it.created_at}`} item={it} />
      ))}
    </ContentGrid>
  );
}
