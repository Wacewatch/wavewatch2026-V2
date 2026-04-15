import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import API from '../lib/api';
import { Bell, X, MessageSquare, Info, Radio as RadioIcon, CheckCheck, Film, Tv, Sparkles, Trash2, Settings } from 'lucide-react';

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const wsRef = useRef(null);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const loadNotifications = useCallback(() => {
    if (user) {
      API.get('/api/notifications').then(({ data }) => {
        setNotifications(data.notifications || []);
        setUnreadCount((data.notifications || []).filter(n => !n.is_read).length);
      }).catch(() => {});
    }
  }, [user]);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  // Auto-check for new episodes of favorited shows
  useEffect(() => {
    if (!user) return;
    API.get('/api/user/check-new-episodes').catch(() => {});
    const iv = setInterval(() => {
      API.get('/api/user/check-new-episodes').catch(() => {});
    }, 300000); // Every 5 min
    return () => clearInterval(iv);
  }, [user]);

  // Refresh notifications periodically
  useEffect(() => {
    if (!user) return;
    const iv = setInterval(loadNotifications, 30000);
    return () => clearInterval(iv);
  }, [user, loadNotifications]);

  // WebSocket connection
  useEffect(() => {
    if (!user) return;
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    const wsUrl = backendUrl.replace('https://', 'wss://').replace('http://', 'ws://') + `/api/ws/${user._id}`;
    try {
      const ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'unread_count') {
          setUnreadCount(data.count);
        } else if (data.type === 'notification') {
          setNotifications(prev => [data, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      };
      ws.onerror = () => {};
      ws.onclose = () => {};
      wsRef.current = ws;
      return () => { ws.close(); };
    } catch {}
  }, [user]);

  const markAllRead = async () => {
    try {
      await API.put('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const deleteNotification = async (notifId, e) => {
    e.stopPropagation();
    try {
      await API.delete(`/api/notifications/${notifId}`);
      setNotifications(prev => prev.filter(n => n._id !== notifId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  if (!user) return null;

  const iconForType = (type) => {
    switch(type) {
      case 'message': return <MessageSquare className="w-4 h-4 text-blue-400" />;
      case 'broadcast': return <RadioIcon className="w-4 h-4 text-purple-400" />;
      case 'release': return <Film className="w-4 h-4 text-red-400" />;
      case 'episode': return <Tv className="w-4 h-4 text-green-400" />;
      case 'vip': return <Sparkles className="w-4 h-4 text-yellow-400" />;
      default: return <Info className="w-4 h-4 text-cyan-400" />;
    }
  };

  const colorForType = (type) => {
    switch(type) {
      case 'message': return 'border-l-blue-500';
      case 'broadcast': return 'border-l-purple-500';
      case 'release': return 'border-l-red-500';
      case 'episode': return 'border-l-green-500';
      case 'vip': return 'border-l-yellow-500';
      default: return 'border-l-cyan-500';
    }
  };

  const filtered = filter === 'all' ? notifications : notifications.filter(n => n.type === filter);
  const filterTabs = [
    { id: 'all', label: 'Tout', count: notifications.length },
    { id: 'release', label: 'Sorties', count: notifications.filter(n => n.type === 'release' || n.type === 'episode').length },
    { id: 'message', label: 'Messages', count: notifications.filter(n => n.type === 'message').length },
    { id: 'broadcast', label: 'Annonces', count: notifications.filter(n => n.type === 'broadcast').length },
  ];

  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "A l'instant";
    if (mins < 60) return `Il y a ${mins}min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `Il y a ${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `Il y a ${days}j`;
  };

  return (
    <div ref={ref} className="relative">
      <button onClick={() => { setOpen(!open); if (!open) loadNotifications(); }} className="relative h-10 w-10 rounded-full border-2 flex items-center justify-center transition-colors hover:opacity-80"
        style={{ borderColor: 'hsl(var(--nav-border))' }} data-testid="notification-bell">
        <Bell className="w-4 h-4" style={{ color: 'hsl(var(--nav-text))' }} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 max-h-[500px] rounded-xl border shadow-2xl z-50 flex flex-col"
          style={{ backgroundColor: 'hsl(var(--nav-bg))', borderColor: 'hsl(var(--nav-border))' }}>
          {/* Header */}
          <div className="p-3 border-b flex items-center justify-between" style={{ borderColor: 'hsl(var(--nav-border))' }}>
            <span className="font-bold text-sm" style={{ color: 'hsl(var(--nav-text))' }}>Notifications {unreadCount > 0 && `(${unreadCount})`}</span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-blue-400 hover:underline flex items-center gap-1" data-testid="mark-all-read"><CheckCheck className="w-3 h-3" />Tout lire</button>
              )}
            </div>
          </div>
          {/* Filters */}
          <div className="flex gap-1 p-2 border-b overflow-x-auto" style={{ borderColor: 'hsl(var(--nav-border))' }}>
            {filterTabs.filter(f => f.count > 0 || f.id === 'all').map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-colors ${filter === f.id ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 hover:bg-secondary'}`}
                style={{ color: filter === f.id ? undefined : 'hsl(var(--nav-text-secondary))' }}>
                {f.label} {f.count > 0 && `(${f.count})`}
              </button>
            ))}
          </div>
          {/* Notifications list */}
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <div className="text-center py-10">
                <Bell className="w-10 h-10 mx-auto mb-2 opacity-20" style={{ color: 'hsl(var(--nav-text-secondary))' }} />
                <p className="text-sm" style={{ color: 'hsl(var(--nav-text-secondary))' }}>Aucune notification</p>
              </div>
            ) : (
              filtered.slice(0, 30).map((n, i) => (
                <div key={n._id || i}
                  className={`p-3 border-b border-l-4 ${colorForType(n.type)} hover:opacity-80 cursor-pointer transition-colors ${!n.is_read ? 'bg-blue-500/5' : ''}`}
                  style={{ borderBottomColor: 'hsl(var(--nav-border))' }}
                  onClick={() => { if (n.link) window.location.href = n.link; }}>
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5">{iconForType(n.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate" style={{ color: 'hsl(var(--nav-text))' }}>{n.title}</p>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="text-[10px]" style={{ color: 'hsl(var(--nav-text-secondary))' }}>{timeAgo(n.created_at)}</span>
                          {n._id && (
                            <button onClick={(e) => deleteNotification(n._id, e)} className="p-0.5 rounded hover:bg-red-500/20 transition-colors" data-testid={`delete-notif-${n._id}`}>
                              <X className="w-3 h-3 text-muted-foreground hover:text-red-400" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'hsl(var(--nav-text-secondary))' }}>{n.message}</p>
                    </div>
                    {!n.is_read && <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />}
                  </div>
                </div>
              ))
            )}
          </div>
          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-2 border-t text-center" style={{ borderColor: 'hsl(var(--nav-border))' }}>
              <Link to="/dashboard" onClick={() => setOpen(false)} className="text-xs text-blue-400 hover:underline">Voir toutes les notifications</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
