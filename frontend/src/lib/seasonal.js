import { useState, useEffect } from 'react';
import API from './api';

const _cache = { data: null, ts: 0 };

export function useSeasonalEvent() {
  const [event, setEvent] = useState(_cache.data);
  const [loading, setLoading] = useState(!_cache.data);

  useEffect(() => {
    if (_cache.data && (Date.now() - _cache.ts) < 600000) {
      setEvent(_cache.data); setLoading(false); return;
    }
    API.get('/api/seasonal-events/active').then(({ data }) => {
      _cache.data = data.event; _cache.ts = Date.now();
      setEvent(data.event);
    }).catch(() => setEvent(null)).finally(() => setLoading(false));
  }, []);

  return { event, loading };
}
