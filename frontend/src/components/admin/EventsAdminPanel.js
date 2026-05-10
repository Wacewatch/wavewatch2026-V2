import React, { useState, useEffect } from 'react';
import API from '../../lib/api';
import { Calendar, Save, Trash2, Plus, X, Sparkles, Power } from 'lucide-react';

const ICONS = ['Sparkles', 'Ghost', 'TreePine', 'Sun', 'Heart', 'Cake', 'Zap'];
const THEMES_AUTO = ['halloween', 'christmas', 'estival', 'sakura', 'neon', 'cosmic', 'borealis', 'obsidian', 'cyberpunk', 'jade', 'ocean', 'midnight'];

function EventEditor({ initial, onSave, onCancel, onDelete }) {
  const [data, setData] = useState(initial);
  const setF = (k, v) => setData(d => ({ ...d, [k]: v }));

  const update = (key) => (e) => setF(key, e.target.value);
  const updateNum = (key) => (e) => setF(key, parseFloat(e.target.value) || 0);
  const updateInt = (key) => (e) => setF(key, parseInt(e.target.value) || 0);

  return (
    <div className="rounded-2xl border border-border bg-card/85 backdrop-blur-xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-foreground">{initial.id ? 'Modifier' : 'Nouveau'} l'événement</h3>
        <button onClick={onCancel} className="p-1 rounded hover:bg-foreground/10"><X className="w-4 h-4" /></button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Nom"><input type="text" value={data.name || ''} onChange={update('name')} className="input" /></Field>
        <Field label="Slug"><input type="text" value={data.slug || ''} onChange={update('slug')} className="input" /></Field>
      </div>
      <Field label="Description"><textarea value={data.description || ''} onChange={update('description')} rows={2} className="input" /></Field>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Icône">
          <select value={data.icon || 'Sparkles'} onChange={update('icon')} className="input">
            {ICONS.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </Field>
        <Field label="Couleur">
          <input type="color" value={data.color || '#a855f7'} onChange={update('color')} className="h-10 w-full rounded-lg border border-border bg-background" />
        </Field>
        <Field label="Multiplicateur XP">
          <input type="number" step="0.5" min="0.5" max="10" value={data.xp_multiplier || 1} onChange={updateNum('xp_multiplier')} className="input" />
        </Field>
      </div>

      <Field label="Thème auto-appliqué (si user n'a pas choisi manuellement)">
        <select value={data.auto_theme || ''} onChange={update('auto_theme')} className="input">
          <option value="">Aucun</option>
          {THEMES_AUTO.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </Field>

      <div className="grid grid-cols-4 gap-2">
        <Field label="Mois début"><input type="number" min="1" max="12" value={data.month_start || 1} onChange={updateInt('month_start')} className="input" /></Field>
        <Field label="Jour début"><input type="number" min="1" max="31" value={data.day_start || 1} onChange={updateInt('day_start')} className="input" /></Field>
        <Field label="Mois fin"><input type="number" min="1" max="12" value={data.month_end || 12} onChange={updateInt('month_end')} className="input" /></Field>
        <Field label="Jour fin"><input type="number" min="1" max="31" value={data.day_end || 31} onChange={updateInt('day_end')} className="input" /></Field>
      </div>

      <Field label="IDs de genres bonus (TMDB, séparés par virgule)">
        <input type="text" value={(data.bonus_genres || []).join(',')} onChange={e => setF('bonus_genres', e.target.value.split(',').map(x => parseInt(x.trim())).filter(Boolean))} placeholder="27,9648 (horror, mystery)" className="input" />
      </Field>

      <Field label="Types de contenu bonus (séparés par virgule)">
        <input type="text" value={(data.bonus_content_types || []).join(',')} onChange={e => setF('bonus_content_types', e.target.value.split(',').map(x => x.trim()).filter(Boolean))} placeholder="movie,tv,anime" className="input" />
      </Field>

      <label className="flex items-center gap-2">
        <input type="checkbox" checked={!!data.active} onChange={e => setF('active', e.target.checked)} />
        <span className="text-sm font-bold">Activé</span>
      </label>

      <div className="flex justify-between pt-3 border-t border-border">
        {initial.id ? (
          <button onClick={() => onDelete(initial.id)} className="px-3 py-2 rounded-lg bg-destructive/15 text-destructive hover:bg-destructive/25 text-sm font-bold flex items-center gap-1">
            <Trash2 className="w-4 h-4" />Supprimer
          </button>
        ) : <div />}
        <button onClick={() => onSave(data)} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold flex items-center gap-1">
          <Save className="w-4 h-4" />Enregistrer
        </button>
      </div>

      <style>{`.input { width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid hsl(var(--border)); background: hsl(var(--background)); color: hsl(var(--foreground)); font-size: 14px; outline: none; } .input:focus { border-color: hsl(var(--primary) / 0.6); }`}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-widest font-bold text-foreground/60 block mb-1">{label}</span>
      {children}
    </label>
  );
}

export default function EventsAdminPanel({ toast }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const load = () => {
    setLoading(true);
    API.get('/api/admin/seasonal-events').then(({ data }) => setEvents(data.events || [])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleSave = async (data) => {
    try {
      if (data.id) {
        await API.put(`/api/admin/seasonal-events/${data.id}`, data);
      } else {
        await API.post('/api/admin/seasonal-events', data);
      }
      toast?.({ title: 'Événement enregistré' });
      setEditing(null); load();
    } catch (e) {
      toast?.({ title: 'Erreur', description: e.response?.data?.detail || 'Échec', variant: 'destructive' });
    }
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cet événement ?')) return;
    await API.delete(`/api/admin/seasonal-events/${id}`);
    toast?.({ title: 'Événement supprimé' });
    setEditing(null); load();
  };
  const toggleActive = async (e) => {
    await API.put(`/api/admin/seasonal-events/${e.id}`, { ...e, active: !e.active });
    load();
  };

  if (loading) return <div className="text-center py-12 text-foreground/60">Chargement...</div>;

  return (
    <div className="space-y-4" data-testid="admin-events-panel">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-foreground flex items-center gap-2"><Calendar className="w-6 h-6 text-primary" />Événements saisonniers</h2>
          <p className="text-sm text-foreground/60">Gérer les événements automatiques (Halloween, Noël, été, anniversaire...)</p>
        </div>
        <button
          onClick={() => setEditing({ name: '', slug: '', description: '', icon: 'Sparkles', color: '#a855f7', auto_theme: '', month_start: 1, day_start: 1, month_end: 12, day_end: 31, xp_multiplier: 2.0, bonus_genres: [], bonus_content_types: ['movie', 'tv'], active: true })}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold flex items-center gap-2 shadow-lg"
          data-testid="new-event-btn"
        >
          <Plus className="w-4 h-4" />Nouveau
        </button>
      </div>

      {editing && <EventEditor initial={editing} onSave={handleSave} onCancel={() => setEditing(null)} onDelete={handleDelete} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {events.map(e => (
          <div key={e.id} className={`relative overflow-hidden rounded-2xl border-2 p-4 ${e.currently_active ? 'border-emerald-400/60 shadow-lg shadow-emerald-500/20' : 'border-border bg-card/60'}`}
            style={e.currently_active ? { background: `linear-gradient(135deg, ${e.color}25, transparent 50%)` } : {}}
            data-testid={`event-card-${e.slug}`}>
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-3xl opacity-20" style={{ background: e.color }} />
            <div className="relative">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${e.color}, ${e.color}aa)` }}>
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-black text-foreground">{e.name}</p>
                    <p className="text-[10px] text-foreground/60 font-mono">{e.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {e.currently_active && <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-extrabold uppercase tracking-widest">Actif</span>}
                  <button onClick={() => toggleActive(e)} className={`p-1.5 rounded-lg ${e.active ? 'bg-emerald-500/15 text-emerald-300' : 'bg-foreground/10 text-foreground/40'}`} title={e.active ? 'Désactiver' : 'Activer'}>
                    <Power className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-foreground/70 mb-2 line-clamp-2">{e.description}</p>
              <div className="flex flex-wrap gap-1 text-[10px]">
                <span className="px-2 py-0.5 rounded-full bg-foreground/10">{e.month_start}/{e.day_start} → {e.month_end}/{e.day_end}</span>
                <span className="px-2 py-0.5 rounded-full font-bold" style={{ background: `${e.color}25`, color: e.color }}>×{e.xp_multiplier} XP</span>
                {e.auto_theme && <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary">→ {e.auto_theme}</span>}
              </div>
              <button onClick={() => setEditing(e)} className="mt-3 w-full text-xs font-bold py-1.5 rounded-lg bg-foreground/5 hover:bg-foreground/10 transition-colors">
                Modifier
              </button>
            </div>
          </div>
        ))}
      </div>

      {events.length === 0 && (
        <p className="text-center py-12 text-foreground/50">Aucun événement</p>
      )}
    </div>
  );
}
