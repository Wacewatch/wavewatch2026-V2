import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import API from '../lib/api';
import { BarChart3, Heart, Eye, ListMusic, Crown, Star } from 'lucide-react';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ favorites: 0, watched: 0, playlists: 0 });

  useEffect(() => { if (!authLoading && !user) navigate('/login'); }, [user, authLoading, navigate]);
  useEffect(() => { if (user) API.get('/api/user/stats').then(({ data }) => setStats(data)).catch(() => {}); }, [user]);

  if (authLoading || !user) return null;

  return (
    <div className="container mx-auto px-4 py-8" data-testid="dashboard-page">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Tableau de bord</h1>
        <p className="text-muted-foreground">Bienvenue, {user.username} !</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[{icon:<Heart className="w-8 h-8 text-red-400" />,label:'Favoris',value:stats.favorites,to:'/favorites'},
          {icon:<Eye className="w-8 h-8 text-blue-400" />,label:'Vus',value:stats.watched},
          {icon:<ListMusic className="w-8 h-8 text-purple-400" />,label:'Playlists',value:stats.playlists,to:'/playlists'}
        ].map((s,i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-6 hover:border-primary/30 transition-colors">
            {s.to ? <Link to={s.to} className="block">{s.icon}<p className="text-3xl font-bold mt-3">{s.value}</p><p className="text-sm text-muted-foreground">{s.label}</p></Link>
              : <div>{s.icon}<p className="text-3xl font-bold mt-3">{s.value}</p><p className="text-sm text-muted-foreground">{s.label}</p></div>}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Mon Compte</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{user.email}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Statut</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${user.is_admin ? 'bg-red-500/20 text-red-400' : user.is_vip_plus ? 'bg-purple-500/20 text-purple-400' : user.is_vip ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-400'}`}>
                {user.is_admin ? 'Admin' : user.is_vip_plus ? 'VIP+' : user.is_vip ? 'VIP' : 'Standard'}
              </span>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Actions rapides</h2>
          <div className="grid grid-cols-2 gap-3">
            {[{to:'/movies',label:'Films',icon:<BarChart3 className="w-5 h-5" />},{to:'/tv-shows',label:'Series',icon:<Eye className="w-5 h-5" />},
              {to:'/anime',label:'Animes',icon:<Star className="w-5 h-5" />},{to:'/subscription',label:'VIP',icon:<Crown className="w-5 h-5 text-yellow-400" />}
            ].map(a => (
              <Link key={a.to} to={a.to} className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-secondary transition-colors">{a.icon}<span className="text-sm">{a.label}</span></Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
