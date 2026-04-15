import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import API from '../lib/api';
import { Bell, X, MessageSquare, Info, Radio as RadioIcon, CheckCheck } from 'lucide-react';

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const wsRef = useRef(null);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Load notifications
  useEffect(() => {
    if (user) {
      API.get('/api/notifications').then(({ data }) => {
        setNotifications(data.notifications || []);
        setUnreadCount((data.notifications || []).filter(n => !n.is_read).length);
      }).catch(() => {});
    }
  }, [user]);

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

  if (!user) return null;

  const iconForType = (type) => {
    if (type === 'message') return <MessageSquare className="w-4 h-4 text-blue-400" />;
    if (type === 'broadcast') return <RadioIcon className="w-4 h-4 text-purple-400" />;
    return <Info className="w-4 h-4 text-green-400" />;
  };

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="relative h-10 w-10 rounded-full border-2 flex items-center justify-center transition-colors hover:opacity-80"
        style={{ borderColor: 'hsl(var(--nav-border))' }} data-testid="notification-bell">
        <Bell className="w-4 h-4" style={{ color: 'hsl(var(--nav-text))' }} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border shadow-2xl z-50"
          style={{ backgroundColor: 'hsl(var(--nav-bg))', borderColor: 'hsl(var(--nav-border))' }}>
          <div className="p-3 border-b flex items-center justify-between" style={{ borderColor: 'hsl(var(--nav-border))' }}>
            <span className="font-bold text-sm" style={{ color: 'hsl(var(--nav-text))' }}>Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-blue-400 hover:underline flex items-center gap-1"><CheckCheck className="w-3 h-3" />Tout lire</button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="text-center py-8 text-sm" style={{ color: 'hsl(var(--nav-text-secondary))' }}>Aucune notification</p>
          ) : (
            notifications.slice(0, 20).map((n, i) => (
              <div key={n._id || i} className={`p-3 border-b hover:opacity-80 cursor-pointer ${!n.is_read ? 'bg-blue-500/5' : ''}`}
                style={{ borderColor: 'hsl(var(--nav-border))' }}
                onClick={() => { if (n.link) window.location.href = n.link; }}>
                <div className="flex items-start gap-2">
                  {iconForType(n.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'hsl(var(--nav-text))' }}>{n.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--nav-text-secondary))' }}>{n.message}</p>
                    <p className="text-[10px] mt-1" style={{ color: 'hsl(var(--nav-text-secondary))' }}>{n.created_at ? new Date(n.created_at).toLocaleString('fr-FR') : ''}</p>
                  </div>
                  {!n.is_read && <span className="w-2 h-2 rounded-full bg-blue-500 mt-1 flex-shrink-0" />}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
