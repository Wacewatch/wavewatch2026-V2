import React, { useState, useEffect } from 'react';
import API from '../lib/api';
import { BookOpen } from 'lucide-react';

export default function EbooksPage() {
  const [ebooks, setEbooks] = useState([]);
  useEffect(() => { API.get('/api/ebooks').then(({ data }) => setEbooks(data.ebooks || [])).catch(() => {}); }, []);

  return (
    <div className="container mx-auto px-4 py-8" data-testid="ebooks-page">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-3"><BookOpen className="w-8 h-8" />Ebooks</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {ebooks.map(b => (
          <div key={b.id} className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-colors">
            <div className="aspect-[3/4] bg-muted"><img src={b.cover} alt={b.title} className="w-full h-full object-cover" onError={e => { e.target.src = 'https://placehold.co/300x400/333/ccc?text=Book'; }} /></div>
            <div className="p-3"><h3 className="font-medium text-sm line-clamp-2">{b.title}</h3><p className="text-xs text-muted-foreground mt-1">{b.author}</p><span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-secondary">{b.category}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}
