import React, { useEffect, useState } from 'react';
import API from '../lib/api';
import { Download, Globe, HardDrive, Shield, Film, Tv, ExternalLink, CheckCircle2 } from 'lucide-react';
import { qualityColor, timeAgo } from './DownloadLinksRow';

/**
 * DownloadLinksSection - shows all download links for a specific TMDB content.
 * Used on MovieDetailPage and EpisodeDetailPage.
 *
 * Props:
 * - tmdbId : int
 * - mediaType : 'movie' | 'tv'
 * - season, episode : int (for tv episodes only)
 */
export default function DownloadLinksSection({ tmdbId, mediaType, season, episode }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeQuality, setActiveQuality] = useState('all');
  const [activeLang, setActiveLang] = useState('all');

  useEffect(() => {
    if (!tmdbId) return;
    const params = new URLSearchParams({ tmdb_id: String(tmdbId), media_type: mediaType });
    if (season != null) params.set('season', String(season));
    if (episode != null) params.set('episode', String(episode));
    setLoading(true);
    API.get(`/api/download-links/for-content?${params.toString()}`)
      .then(({ data }) => setItems(data.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [tmdbId, mediaType, season, episode]);

  if (loading) {
    return (
      <section className="mt-10">
        <h2 className="text-2xl font-bold flex items-center gap-2 mb-4"><Download className="w-6 h-6 text-emerald-400" />Liens de téléchargement</h2>
        <div className="h-24 rounded-xl bg-secondary/30 animate-pulse" />
      </section>
    );
  }

  if (!items.length) return null;

  const qualities = Array.from(new Set(items.map(i => (i.quality || '').toUpperCase()).filter(Boolean)));
  const languages = Array.from(new Set(items.map(i => (i.language || '').toUpperCase()).filter(Boolean)));

  const filtered = items.filter(it => {
    if (activeQuality !== 'all' && (it.quality || '').toUpperCase() !== activeQuality) return false;
    if (activeLang !== 'all' && (it.language || '').toUpperCase() !== activeLang) return false;
    return true;
  });

  return (
    <section className="mt-10" data-testid="download-links-section">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Download className="w-6 h-6 text-emerald-400" />
          Liens de téléchargement
          <span className="text-sm font-normal text-muted-foreground">({items.length})</span>
        </h2>
      </div>

      {/* Filters */}
      {(qualities.length > 1 || languages.length > 1) && (
        <div className="flex flex-wrap gap-3 mb-5">
          {qualities.length > 1 && (
            <div className="flex gap-1.5 items-center">
              <span className="text-xs text-muted-foreground mr-1">Qualité :</span>
              <button onClick={() => setActiveQuality('all')} className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${activeQuality === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-secondary'}`}>Toutes</button>
              {qualities.map(q => (
                <button key={q} onClick={() => setActiveQuality(q)} className={`text-xs px-2.5 py-1 rounded-md border font-semibold transition-colors ${activeQuality === q ? qualityColor(q) : 'border-border hover:bg-secondary'}`}>{q}</button>
              ))}
            </div>
          )}
          {languages.length > 1 && (
            <div className="flex gap-1.5 items-center">
              <span className="text-xs text-muted-foreground mr-1">Langue :</span>
              <button onClick={() => setActiveLang('all')} className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${activeLang === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-secondary'}`}>Toutes</button>
              {languages.map(l => (
                <button key={l} onClick={() => setActiveLang(l)} className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${activeLang === l ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'border-border hover:bg-secondary'}`}>{l}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Links table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-3 text-xs font-medium text-muted-foreground border-b border-border bg-secondary/20">
          <div className="col-span-4">Source</div>
          <div className="col-span-1">Qualité</div>
          <div className="col-span-1">Résolution</div>
          <div className="col-span-1">Langue</div>
          <div className="col-span-2">Ajouté</div>
          <div className="col-span-1">Taille</div>
          <div className="col-span-2 text-right">Action</div>
        </div>
        <ul className="divide-y divide-border">
          {filtered.map(it => (
            <li key={it.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-secondary/20 transition-colors" data-testid={`dl-link-${it.id}`}>
              <div className="md:col-span-4 min-w-0">
                <div className="flex items-center gap-2">
                  {mediaType === 'tv' ? <Tv className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <Film className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                  <span className="font-medium truncate">{it.source_name || it.ww_id}</span>
                  {it.is_verified && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" title="Vérifié" />}
                </div>
                {it.release_name && (
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">{it.release_name}</p>
                )}
              </div>
              <div className="md:col-span-1">
                {it.quality && (
                  <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded border inline-block ${qualityColor(it.quality)}`}>{it.quality.toUpperCase()}</span>
                )}
              </div>
              <div className="md:col-span-1 text-xs text-muted-foreground">{it.resolution || '—'}</div>
              <div className="md:col-span-1">
                {it.language && (
                  <span className="text-[11px] inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-medium">
                    <Globe className="w-2.5 h-2.5" />{String(it.language).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="md:col-span-2 text-xs text-muted-foreground">{timeAgo(it.created_at)}</div>
              <div className="md:col-span-1 text-xs text-muted-foreground inline-flex items-center gap-1">
                <HardDrive className="w-3 h-3" />{it.file_size || '—'}
              </div>
              <div className="md:col-span-2 md:text-right">
                <a
                  href={it.source_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
                  data-testid={`dl-action-${it.id}`}
                >
                  <Download className="w-3.5 h-3.5" />Télécharger<ExternalLink className="w-3 h-3 opacity-70" />
                </a>
              </div>
            </li>
          ))}
        </ul>
        {filtered.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">Aucun lien pour ces filtres</div>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground mt-2 inline-flex items-center gap-1.5">
        <Shield className="w-3 h-3" />Liens fournis par la communauté WWembed
      </p>
    </section>
  );
}
