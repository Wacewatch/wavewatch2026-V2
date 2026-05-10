import React from 'react';
import { Shield, Globe, Lock, Sparkles, Copy, ExternalLink, Check } from 'lucide-react';
import { useState } from 'react';

const DNS_LIST = [
  { name: 'Cloudflare', primary: '1.1.1.1',         secondary: '1.0.0.1',         hex: '#f38020', desc: 'Le plus rapide • respect vie privée' },
  { name: 'Google',     primary: '8.8.8.8',         secondary: '8.8.4.4',         hex: '#4285f4', desc: 'Stable et fiable mondialement' },
  { name: 'Quad9',      primary: '9.9.9.9',         secondary: '149.112.112.112', hex: '#a855f7', desc: 'Bloque les sites malveillants' },
  { name: 'OpenDNS',    primary: '208.67.222.222',  secondary: '208.67.220.220',  hex: '#10b981', desc: 'Filtrage parental disponible' },
];

const VPN_LIST = [
  { name: 'NordVPN',    desc: 'Rapide et sécurisé',          tag: 'Recommandé',       hex: '#3b82f6', url: 'https://nordvpn.com' },
  { name: 'ExpressVPN', desc: 'Fiable et ultra-rapide',      tag: 'Premium',          hex: '#ef4444', url: 'https://expressvpn.com' },
  { name: 'ProtonVPN',  desc: 'Version gratuite disponible', tag: 'Gratuit',          hex: '#10b981', url: 'https://protonvpn.com' },
];

function CopyChip({ value, hex }) {
  const [copied, setCopied] = useState(false);
  const onClick = async () => {
    try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };
  return (
    <button onClick={onClick}
      className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-mono text-white transition-colors"
      data-testid={`copy-${value}`}
    >
      <span style={{ color: hex }} className="font-bold">{value}</span>
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />}
    </button>
  );
}

export default function DNSVPNPage() {
  return (
    <div className="relative min-h-screen text-white" style={{ background: 'linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--card)) 35%, hsl(var(--background)) 100%)' }} data-testid="dns-vpn-page">
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-32 -left-32 w-[40rem] h-[40rem] rounded-full opacity-30 blur-3xl"
          style={{ background: 'radial-gradient(closest-side, hsl(var(--primary) / 0.45), transparent 70%)', animation: 'pulse 8s ease-in-out infinite' }} />
        <div className="absolute top-40 -right-40 w-[36rem] h-[36rem] rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(closest-side, hsl(var(--accent) / 0.45), transparent 70%)', animation: 'pulse 10s ease-in-out infinite' }} />
        <div className="absolute bottom-0 left-1/3 w-[32rem] h-[32rem] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(closest-side, hsl(var(--accent) / 0.45), transparent 70%)', animation: 'pulse 12s ease-in-out infinite' }} />
      </div>

      <div className="relative container mx-auto px-4 py-8 max-w-5xl">
        {/* HERO */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 mb-8 backdrop-blur-sm" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.18), rgba(6,182,212,0.12) 35%, rgba(59,130,246,0.18) 65%, rgba(168,85,247,0.15))' }}>
          <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          <div className="absolute -top-20 right-10 w-72 h-72 rounded-full blur-3xl opacity-50" style={{ background: 'radial-gradient(closest-side, rgba(16,185,129,0.6), transparent 70%)' }} />

          <div className="relative px-6 md:px-12 py-10 md:py-14">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles className="w-3 h-3" />Confidentialité & accès
            </span>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-3 leading-[1.05]">
              <span className="block bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #fff 0%, #6ee7b7 40%, #67e8f9 70%, #93c5fd 100%)' }}>
                DNS &
              </span>
              <span className="block text-white"><span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #34d399, #06b6d4, #3b82f6)' }}>VPN</span> Recommandés</span>
            </h1>
            <p className="text-slate-300 max-w-2xl text-base md:text-lg leading-relaxed">
              Optimise ton accès et protège ta vie privée. <span className="text-white font-semibold">DNS rapides</span> pour fluidifier la navigation, <span className="text-white font-semibold">VPN sérieux</span> pour rester anonyme.
            </p>
          </div>
        </div>

        {/* DNS */}
        <div className="rounded-2xl border border-white/10 bg-card/80 backdrop-blur-xl p-5 md:p-6 mb-6 shadow-xl shadow-black/30">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white">DNS Recommandés</h2>
              <p className="text-xs text-slate-400">Clique sur une adresse pour la copier</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DNS_LIST.map(d => (
              <div key={d.name} className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-colors p-4 group" data-testid={`dns-card-${d.name.toLowerCase()}`}>
                <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" style={{ background: d.hex }} />
                <div className="relative flex items-center justify-between mb-3">
                  <h3 className="font-black text-white text-lg">{d.name}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: `${d.hex}22`, color: d.hex, border: `1px solid ${d.hex}55` }}>DNS</span>
                </div>
                <p className="relative text-xs text-slate-400 mb-3">{d.desc}</p>
                <div className="relative space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Primaire</span>
                    <CopyChip value={d.primary} hex={d.hex} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Secondaire</span>
                    <CopyChip value={d.secondary} hex={d.hex} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* VPN */}
        <div className="rounded-2xl border border-white/10 bg-card/80 backdrop-blur-xl p-5 md:p-6 shadow-xl shadow-black/30">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white">VPN Recommandés</h2>
              <p className="text-xs text-slate-400">Pour naviguer en privé et débloquer les contenus</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {VPN_LIST.map(v => (
              <a key={v.name} href={v.url} target="_blank" rel="noopener noreferrer"
                 className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/25 transition-all p-5 flex flex-col items-center text-center"
                 data-testid={`vpn-card-${v.name.toLowerCase()}`}
              >
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full blur-3xl opacity-25 group-hover:opacity-50 transition-opacity" style={{ background: v.hex }} />
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 mx-auto shadow-lg" style={{ background: `linear-gradient(135deg, ${v.hex}, ${v.hex}99)`, boxShadow: `0 8px 24px ${v.hex}44` }}>
                    <Shield className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-black text-white text-lg mb-1">{v.name}</h3>
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2" style={{ background: `${v.hex}22`, color: v.hex, border: `1px solid ${v.hex}55` }}>{v.tag}</span>
                  <p className="text-xs text-slate-400 mb-3">{v.desc}</p>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-cyan-300 group-hover:translate-x-0.5 transition-transform">
                    Visiter le site <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
