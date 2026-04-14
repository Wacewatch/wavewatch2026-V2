import React, { useState, useEffect } from 'react';
import API from '../lib/api';
import { Download, Monitor } from 'lucide-react';

export default function SoftwarePage() {
  const [software, setSoftware] = useState([]);
  useEffect(() => { API.get('/api/software').then(({ data }) => setSoftware(data.software || [])).catch(() => {}); }, []);

  return (
    <div className="container mx-auto px-4 py-8" data-testid="software-page">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-3"><Monitor className="w-8 h-8" />Logiciels</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {software.map(s => (
          <div key={s.id} className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0"><img src={s.icon} alt={s.name} className="w-full h-full object-contain" /></div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold">{s.name}</h3>
                <p className="text-xs text-muted-foreground">v{s.version} | {s.platform}</p>
                <p className="text-sm text-muted-foreground mt-2">{s.description}</p>
                <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-secondary">{s.category}</span>
              </div>
            </div>
            {s.download_url && (
              <a href={s.download_url} target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center justify-center gap-2 py-2 rounded-lg border border-blue-600 text-blue-400 hover:bg-blue-900/20 transition-colors text-sm">
                <Download className="w-4 h-4" />Telecharger
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
