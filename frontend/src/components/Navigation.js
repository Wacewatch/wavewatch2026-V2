import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import API, { TMDB_IMG } from '../lib/api';
import { Search, Menu, X, User, LogOut, Crown, Shield, ChevronDown, Palette, Calendar, Trophy, Gamepad2, Music, Film, Tv, Users as UsersIcon, Sparkles } from 'lucide-react';
import NotificationBell from './NotificationBell';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [contentOpen, setContentOpen] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);
  const { user, signOut } = useAuth();
  const { theme, setTheme, THEMES, EXCEPTIONAL_THEMES, LIMITED_THEMES, PREMIUM_THEMES } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  const navRef = useRef(null);

  // Close all dropdowns on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setContentOpen(false); setMediaOpen(false); setThemeOpen(false); setUserMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Autocomplete
  const fetchSuggestions = useCallback((q) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q || q.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    debounceRef.current = setTimeout(() => {
      API.get(`/api/tmdb/search?q=${encodeURIComponent(q)}&page=1`).then(({ data }) => {
        const results = (data.results || []).slice(0, 8).map(r => ({
          id: r.id, title: r.title || r.name, media_type: r.media_type,
          poster_path: r.poster_path || r.profile_path,
          year: (r.release_date || r.first_air_date || '').substring(0, 4)
        }));
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      }).catch(() => {});
    }, 300);
  }, []);

  const onSearchChange = (e) => { setSearchQuery(e.target.value); fetchSuggestions(e.target.value); };

  const handleSuggestionClick = (s) => {
    const path = s.media_type === 'movie' ? `/movies/${s.id}` : s.media_type === 'tv' ? `/tv-shows/${s.id}` : s.media_type === 'person' ? `/actors/${s.id}` : `/search?q=${s.title}`;
    navigate(path); setSearchQuery(''); setShowSuggestions(false); setSuggestions([]);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsMenuOpen(false); setShowSuggestions(false); setSuggestions([]);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setIsMenuOpen(false);
  };

  const handleThemeChange = (themeId, requiresVip, requiresVipPlus) => {
    if (requiresVipPlus && !user?.is_vip_plus && !user?.is_admin) {
      toast({ title: 'Theme VIP+ requis', description: 'Ce theme est reserve aux membres VIP+', variant: 'destructive' });
      return;
    }
    if (requiresVip && !user?.is_vip && !user?.is_vip_plus && !user?.is_admin) {
      toast({ title: 'Theme VIP requis', description: 'Ce theme est reserve aux membres VIP et VIP+', variant: 'destructive' });
      return;
    }
    setTheme(themeId);
    toast({ title: 'Theme change', description: 'Le theme a ete change avec succes' });
    setThemeOpen(false);
  };

  const navStyle = {
    background: 'linear-gradient(180deg, hsl(var(--nav-bg) / 0.92) 0%, hsl(var(--background) / 0.85) 100%)',
    borderColor: 'hsl(var(--nav-border) / 0.4)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  };
  const textStyle = { color: 'hsl(var(--nav-text))' };
  const textSecStyle = { color: 'hsl(var(--nav-text-secondary))' };
  const dropBg = {
    background: 'linear-gradient(180deg, hsl(var(--nav-dropdown-bg) / 0.98) 0%, hsl(var(--nav-bg) / 0.98) 100%)',
    borderColor: 'hsl(var(--nav-border) / 0.5)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
  };

  const DropdownItem = ({ to, children, onClick, external, badge }) => {
    const cls = "block w-full text-left px-4 py-2.5 text-sm transition-all flex items-center justify-between hover:bg-white/5 hover:pl-5 group";
    if (external) return (
      <a href={to} target="_blank" rel="noopener noreferrer" className={cls} style={textStyle} onClick={() => { setContentOpen(false); setMediaOpen(false); setUserMenuOpen(false); }}>
        <span className="flex items-center gap-2">{children}</span>{badge && <span className="ml-2 px-2 py-0.5 text-[10px] font-extrabold text-white rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 shadow-lg shadow-orange-500/30">{badge}</span>}
      </a>
    );
    if (onClick) return <button className={cls} style={textStyle} onClick={() => { onClick(); setUserMenuOpen(false); }}>{children}</button>;
    return (
      <Link to={to} className={cls} style={textStyle} onClick={() => { setContentOpen(false); setMediaOpen(false); setUserMenuOpen(false); }}>
        <span className="flex items-center gap-2">{children}</span>{badge && <span className="ml-2 px-2 py-0.5 text-[10px] font-extrabold text-white rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 shadow-lg shadow-orange-500/30">{badge}</span>}
      </Link>
    );
  };

  const NavLink = ({ open, onClick, label, testId }) => (
    <button onClick={onClick}
      className={`flex items-center gap-1.5 h-10 px-3 rounded-xl font-semibold text-sm transition-all ${
        open ? 'bg-white/10 text-white shadow-inner' : 'text-white/80 hover:text-white hover:bg-white/5'
      }`}
      data-testid={testId}>
      {label} <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
  );

  return (
    <nav ref={navRef} className="sticky top-0 z-50 border-b" style={navStyle} data-testid="main-navigation">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link to="/" className="flex items-center flex-shrink-0 group transition-all hover:scale-[1.02]" data-testid="logo-link">
            <div className="relative">
              <div className="absolute inset-0 blur-xl opacity-40 group-hover:opacity-70 transition-opacity"
                style={{ background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--ring)))' }} />
              <img src="https://i.imgur.com/yY5KJ9t.png" alt="WaveWatch"
                className="relative h-10 md:h-14 w-auto object-contain"
                style={{ filter: 'drop-shadow(0 4px 18px hsl(var(--primary) / 0.5))' }} />
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center space-x-1">
            <div className="relative">
              <NavLink open={contentOpen} onClick={() => { setContentOpen(!contentOpen); setMediaOpen(false); }} label="Contenu" testId="content-dropdown" />
              {contentOpen && (
                <div className="absolute top-full left-0 mt-2 w-52 rounded-2xl border shadow-2xl shadow-black/50 py-1.5 z-50 overflow-hidden" style={dropBg}>
                  <DropdownItem to="/movies"><Film className="w-4 h-4 text-red-400" />Films</DropdownItem>
                  <DropdownItem to="/tv-shows"><Tv className="w-4 h-4 text-blue-400" />Séries</DropdownItem>
                  <DropdownItem to="/anime"><Tv className="w-4 h-4 text-pink-400" />Animes</DropdownItem>
                  <DropdownItem to="/actors"><UsersIcon className="w-4 h-4 text-amber-400" />Acteurs</DropdownItem>
                  <div className="border-t my-1" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
                  <DropdownItem to="/music"><Music className="w-4 h-4 text-fuchsia-400" />Musique</DropdownItem>
                  <DropdownItem to="/games"><Gamepad2 className="w-4 h-4 text-emerald-400" />Jeux</DropdownItem>
                  <DropdownItem to="/ebooks"><Calendar className="w-4 h-4 text-orange-400" />Ebooks</DropdownItem>
                  <DropdownItem to="/logiciels"><Calendar className="w-4 h-4 text-cyan-400" />Logiciels</DropdownItem>
                </div>
              )}
            </div>
            <div className="relative">
              <NavLink open={mediaOpen} onClick={() => { setMediaOpen(!mediaOpen); setContentOpen(false); }} label="Médias" testId="media-dropdown" />
              {mediaOpen && (
                <div className="absolute top-full left-0 mt-2 w-60 rounded-2xl border shadow-2xl shadow-black/50 py-1.5 z-50 overflow-hidden" style={dropBg}>
                  <DropdownItem to="/tv-channels"><Tv className="w-4 h-4 text-red-400" />Chaînes TV</DropdownItem>
                  <DropdownItem to="/radio"><Music className="w-4 h-4 text-cyan-400" />Radio FM</DropdownItem>
                  <DropdownItem to="/retrogaming"><Gamepad2 className="w-4 h-4 text-emerald-400" />Retrogaming</DropdownItem>
                  <DropdownItem to="/calendar"><Calendar className="w-4 h-4 text-blue-400" />Calendrier</DropdownItem>
                  <DropdownItem to="/discover/playlists"><Trophy className="w-4 h-4 text-purple-400" />Playlists</DropdownItem>
                </div>
              )}
            </div>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-md mx-4" ref={searchRef}>
            <div className="relative w-full group">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500/0 via-fuchsia-500/0 to-blue-500/0 opacity-0 group-focus-within:opacity-100 group-focus-within:from-red-500/40 group-focus-within:via-fuchsia-500/40 group-focus-within:to-blue-500/40 blur-md transition-all" />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 z-10" />
              <input type="text" placeholder="Rechercher films, séries, acteurs…" value={searchQuery} onChange={onSearchChange}
                onFocus={() => { if (suggestions.length) setShowSuggestions(true); }}
                className="relative w-full pl-11 pr-4 h-11 rounded-full border outline-none text-sm font-medium transition-all placeholder:text-white/40"
                style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.95)' }}
                data-testid="search-input" />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl border shadow-2xl shadow-black/50 overflow-hidden z-50" style={dropBg} data-testid="search-suggestions">
                  {suggestions.map(s => (
                    <button key={`${s.media_type}-${s.id}`} onClick={() => handleSuggestionClick(s)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5 transition-colors" style={textStyle}>
                      <div className="w-9 h-13 flex-shrink-0 rounded overflow-hidden bg-white/5">
                        {s.poster_path ? <img src={`${TMDB_IMG}/w92${s.poster_path}`} alt="" className="w-full h-full object-cover" /> :
                          <div className="w-full h-full flex items-center justify-center">{s.media_type === 'person' ? <UsersIcon className="w-4 h-4 text-white/40" /> : <Film className="w-4 h-4 text-white/40" />}</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{s.title}</p>
                        <div className="flex items-center gap-2 text-xs" style={textSecStyle}>
                          {s.media_type === 'movie' && <span className="flex items-center gap-1 text-red-300"><Film className="w-3 h-3" />Film</span>}
                          {s.media_type === 'tv' && <span className="flex items-center gap-1 text-blue-300"><Tv className="w-3 h-3" />Série</span>}
                          {s.media_type === 'person' && <span className="flex items-center gap-1 text-amber-300"><UsersIcon className="w-3 h-3" />Acteur</span>}
                          {s.year && <span>{s.year}</span>}
                        </div>
                      </div>
                    </button>
                  ))}
                  <button onClick={() => { navigate(`/search?q=${encodeURIComponent(searchQuery)}`); setShowSuggestions(false); }}
                    className="w-full px-4 py-2.5 text-xs font-bold text-center border-t hover:bg-white/5 transition-colors uppercase tracking-wider"
                    style={{ ...textStyle, borderColor: 'rgba(255,255,255,0.08)' }}>
                    Voir tous les résultats
                  </button>
                </div>
              )}
            </div>
          </form>

          {/* Right side */}
          <div className="flex items-center space-x-2 md:space-x-3">
            {/* Theme picker */}
            <div className="relative">
              <button onClick={() => setThemeOpen(!themeOpen)}
                className="h-10 w-10 rounded-full flex items-center justify-center transition-all bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 hover:scale-105"
                data-testid="theme-picker-btn">
                <Palette className="w-4 h-4 text-white/85" />
              </button>
              {themeOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 max-h-[70vh] overflow-y-auto rounded-2xl border shadow-2xl p-3 z-50" style={dropBg}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-2 px-1 flex items-center gap-1.5" style={textStyle}>
                    <Sparkles className="w-3 h-3" />Thèmes Standard
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 mb-3">
                    {THEMES.map(t => (
                      <button key={t.id} onClick={() => handleThemeChange(t.id)}
                        className={`flex items-center gap-2 p-2 rounded-lg transition-all hover:bg-white/5 relative ${theme === t.id ? 'ring-2 ring-cyan-400' : ''}`}
                        data-testid={`theme-${t.id}`}>
                        <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${t.gradient} shadow-md`} />
                        <span className="text-xs font-semibold" style={textStyle}>{t.name}</span>
                      </button>
                    ))}
                  </div>

                  <p className="text-[10px] font-bold uppercase tracking-widest mb-2 px-1 flex items-center gap-1.5" style={{ color: 'hsl(180 90% 60%)' }}>
                    <Sparkles className="w-3 h-3" />Exceptionnels
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 mb-3">
                    {EXCEPTIONAL_THEMES.map(t => (
                      <button key={t.id} onClick={() => handleThemeChange(t.id)}
                        className={`flex items-center gap-2 p-2 rounded-lg transition-all hover:bg-white/5 relative border border-cyan-400/20 ${theme === t.id ? 'ring-2 ring-cyan-400' : ''}`}
                        data-testid={`theme-${t.id}`}>
                        <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${t.gradient} shadow-md ring-1 ring-cyan-300/40`} />
                        <span className="text-xs font-semibold" style={textStyle}>{t.name}</span>
                        <span className="absolute -top-1 -right-1 px-1 py-0.5 text-[8px] font-extrabold bg-gradient-to-r from-cyan-400 to-emerald-400 text-black rounded shadow-md">★</span>
                      </button>
                    ))}
                  </div>

                  <p className="text-[10px] font-bold uppercase tracking-widest mb-2 px-1" style={{ color: 'hsl(35 90% 65%)' }}>Limités</p>
                  <div className="grid grid-cols-2 gap-1.5 mb-3">
                    {LIMITED_THEMES.map(t => (
                      <button key={t.id} onClick={() => handleThemeChange(t.id)}
                        className={`flex items-center gap-2 p-2 rounded-lg transition-all hover:bg-white/5 relative ${theme === t.id ? 'ring-2 ring-cyan-400' : ''}`}
                        data-testid={`theme-${t.id}`}>
                        <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${t.gradient} shadow-md`} />
                        <span className="text-xs font-semibold" style={textStyle}>{t.name}</span>
                      </button>
                    ))}
                  </div>

                  {user && (<>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-2 px-1 flex items-center gap-1.5" style={{ color: 'hsl(45 95% 65%)' }}>
                      <Crown className="w-3 h-3" />Premium VIP
                      {!user.is_vip && !user.is_vip_plus && !user.is_admin && <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-400/40">VIP requis</span>}
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {PREMIUM_THEMES.map(t => {
                        const locked = (t.requiresVipPlus && !user.is_vip_plus && !user.is_admin) || (t.requiresVip && !user.is_vip && !user.is_vip_plus && !user.is_admin);
                        return (
                          <button key={t.id} onClick={() => handleThemeChange(t.id, t.requiresVip, t.requiresVipPlus)}
                            className={`flex items-center gap-2 p-2 rounded-lg transition-all hover:bg-white/5 relative ${theme === t.id ? 'ring-2 ring-cyan-400' : ''} ${locked ? 'opacity-50' : ''} ${t.exceptional ? 'border border-amber-400/30' : ''}`}
                            data-testid={`theme-${t.id}`}>
                            <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${t.gradient} shadow-md ${t.hasAnimation ? 'animate-pulse' : ''} ${t.exceptional ? 'ring-1 ring-amber-300/50' : ''}`} />
                            <span className="text-xs font-semibold" style={textStyle}>{t.name}</span>
                            {t.requiresVipPlus && <Crown className="w-3 h-3 text-purple-300" />}
                            {t.exceptional && <span className="absolute -top-1 -right-1 px-1 py-0.5 text-[8px] font-extrabold bg-gradient-to-r from-amber-400 to-orange-500 text-black rounded shadow-md">★</span>}
                          </button>
                        );
                      })}
                    </div>
                  </>)}
                </div>
              )}
            </div>

            {/* Notification Bell */}
            {user && <NotificationBell />}

            {/* User menu */}
            {user ? (
              <div className="relative">
                <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="relative h-10 px-2 sm:px-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 flex items-center gap-2 transition-all"
                  data-testid="user-menu-btn">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-500 via-fuchsia-500 to-purple-600 flex items-center justify-center font-extrabold text-white text-xs shadow-lg shadow-red-500/30">
                    {(user.username || 'U')[0].toUpperCase()}
                  </div>
                  {user.is_vip && <Crown className="w-3 h-3 absolute -top-1 -right-1 text-yellow-400 drop-shadow-lg" />}
                  {user.is_admin && <Shield className="w-2.5 h-2.5 absolute top-0 left-0 text-red-400 drop-shadow" />}
                  <span className="text-sm font-semibold hidden xl:inline" style={textStyle}>{user.username}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform hidden sm:inline ${userMenuOpen ? 'rotate-180' : ''}`} style={textSecStyle} />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-60 rounded-2xl border shadow-2xl shadow-black/50 py-1.5 z-50 overflow-hidden" style={dropBg}>
                    <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                      <p className="text-sm font-bold" style={textStyle}>{user.username || 'Utilisateur'}</p>
                      <p className="text-xs flex items-center gap-1 mt-0.5" style={textSecStyle}>
                        {user.is_admin ? <><Shield className="w-3 h-3 text-red-400" /> Administrateur</> : user.is_vip_plus ? <><Crown className="w-3 h-3 text-yellow-400" /> VIP Plus</> : user.is_vip ? <><Crown className="w-3 h-3 text-yellow-400" /> VIP</> : 'Standard'}
                      </p>
                    </div>
                    <DropdownItem to="/dashboard">Tableau de bord</DropdownItem>
                    <DropdownItem to="/favorites">Mes favoris</DropdownItem>
                    <DropdownItem to="/history">Historique</DropdownItem>
                    <DropdownItem to="/playlists">Mes playlists</DropdownItem>
                    <DropdownItem to="/profile">Profil</DropdownItem>
                    {!user.is_vip && <DropdownItem to="/subscription"><span className="text-yellow-400 flex items-center gap-2"><Crown className="w-4 h-4" />Devenir VIP</span></DropdownItem>}
                    {(user.is_admin || user.is_uploader) && (
                      <DropdownItem to="/admin"><span className="text-red-400 flex items-center gap-2"><Shield className="w-4 h-4" />Administration</span></DropdownItem>
                    )}
                    <div className="border-t my-1" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
                    <DropdownItem onClick={() => { handleSignOut(); setUserMenuOpen(false); }}>
                      <span className="flex items-center gap-2"><LogOut className="w-4 h-4" />Déconnexion</span>
                    </DropdownItem>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login" className="h-10 px-4 rounded-full text-sm font-semibold transition-all hover:bg-white/5 flex items-center" style={textStyle} data-testid="login-btn">Connexion</Link>
                <Link to="/register" className="h-10 px-4 rounded-full text-sm font-bold bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-lg shadow-red-500/40 hover:shadow-red-500/60 hover:scale-[1.03] active:scale-95 transition-all flex items-center" data-testid="register-btn">Inscription</Link>
              </div>
            )}

            {/* Mobile menu btn */}
            <button className="h-10 w-10 lg:hidden flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors" onClick={() => setIsMenuOpen(!isMenuOpen)} data-testid="mobile-menu-btn">
              {isMenuOpen ? <X className="w-5 h-5" style={textStyle} /> : <Menu className="w-5 h-5" style={textStyle} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden overflow-y-auto" style={{ background: 'linear-gradient(180deg, hsl(var(--nav-bg) / 0.98), hsl(var(--background) / 0.98))', backdropFilter: 'blur(24px)' }}>
          <div className="container mx-auto px-4 py-6">
            <div className="flex justify-between items-center mb-6">
              <img src="https://i.imgur.com/yY5KJ9t.png" alt="WaveWatch" className="h-10 w-auto object-contain"
                style={{ filter: 'drop-shadow(0 4px 18px hsl(var(--primary) / 0.5))' }} />
              <button onClick={() => setIsMenuOpen(false)} className="h-10 w-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors">
                <X className="w-5 h-5" style={textStyle} />
              </button>
            </div>
            <form onSubmit={handleSearch} className="mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                <input type="text" placeholder="Rechercher..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 h-11 rounded-full border bg-white/5 outline-none text-sm font-medium placeholder:text-white/40"
                  style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.95)' }} />
              </div>
            </form>
            {!user ? (
              <div className="flex flex-col gap-2 mb-6">
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="w-full py-3 text-center rounded-xl font-bold bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/30">Connexion</Link>
                <Link to="/register" onClick={() => setIsMenuOpen(false)} className="w-full py-3 text-center rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 font-bold text-sm" style={textStyle}>Inscription</Link>
              </div>
            ) : (
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 via-fuchsia-500 to-purple-600 flex items-center justify-center font-extrabold text-white text-base shadow-lg shadow-red-500/30">{(user.username || 'U')[0].toUpperCase()}</div>
                  <div className="flex-1"><p className="font-bold" style={textStyle}>{user.username}</p><p className="text-xs flex items-center gap-1 mt-0.5" style={textSecStyle}>{user.is_admin ? <><Shield className="w-3 h-3 text-red-400" /> Admin</> : user.is_vip ? <><Crown className="w-3 h-3 text-yellow-400" /> VIP</> : 'Membre'}</p></div>
                </div>
                <div className="space-y-1">
                  {[{to:'/dashboard',label:'Tableau de bord'},{to:'/favorites',label:'Mes favoris'},{to:'/history',label:'Historique'},{to:'/playlists',label:'Mes playlists'},{to:'/profile',label:'Profil'}].map(l => (
                    <Link key={l.to} to={l.to} onClick={() => setIsMenuOpen(false)} className="block py-2.5 px-3 rounded-xl hover:bg-white/5 transition-colors" style={textStyle}>{l.label}</Link>
                  ))}
                  {(user.is_admin || user.is_uploader) && <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 py-2.5 px-3 rounded-xl text-red-400 hover:bg-red-500/10"><Shield className="w-4 h-4" />Administration</Link>}
                  <button onClick={handleSignOut} className="flex items-center gap-2 w-full text-left py-2.5 px-3 rounded-xl hover:bg-white/5" style={textStyle}><LogOut className="w-4 h-4" />Déconnexion</button>
                </div>
              </div>
            )}
            <div className="border-t pt-4 space-y-1" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <p className="text-xs font-extrabold uppercase tracking-widest mb-2 text-white/50">Contenu</p>
              {[{to:'/movies',l:'Films',I:Film,c:'text-red-400'},{to:'/tv-shows',l:'Séries',I:Tv,c:'text-blue-400'},{to:'/anime',l:'Animes',I:Tv,c:'text-pink-400'},{to:'/actors',l:'Acteurs',I:UsersIcon,c:'text-amber-400'},{to:'/music',l:'Musique',I:Music,c:'text-fuchsia-400'},{to:'/games',l:'Jeux',I:Gamepad2,c:'text-emerald-400'},{to:'/ebooks',l:'Ebooks',I:Calendar,c:'text-orange-400'},{to:'/logiciels',l:'Logiciels',I:Calendar,c:'text-cyan-400'}].map(i => (
                <Link key={i.to} to={i.to} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-white/5 transition-colors" style={textStyle}><i.I className={`w-4 h-4 ${i.c}`} />{i.l}</Link>
              ))}
            </div>
            <div className="border-t pt-4 mt-4 space-y-1" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <p className="text-xs font-extrabold uppercase tracking-widest mb-2 text-white/50">Médias</p>
              {[{to:'/tv-channels',l:'Chaînes TV',I:Tv,c:'text-red-400'},{to:'/radio',l:'Radio FM',I:Music,c:'text-cyan-400'},{to:'/retrogaming',l:'Retrogaming',I:Gamepad2,c:'text-emerald-400'},{to:'/calendar',l:'Calendrier Sorties',I:Calendar,c:'text-blue-400'},{to:'/discover/playlists',l:'Playlists publiques',I:Trophy,c:'text-purple-400'}].map(i => (
                <Link key={i.to} to={i.to} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-white/5 transition-colors" style={textStyle}><i.I className={`w-4 h-4 ${i.c}`} />{i.l}</Link>
              ))}
            </div>
            <div className="border-t pt-4 mt-4 space-y-1" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <p className="text-xs font-extrabold uppercase tracking-widest mb-2 text-white/50">Autres</p>
              {[{to:'/vip-game',l:'Jeu VIP',I:Crown,c:'text-yellow-400'},{to:'/leaderboard',l:'Classement',I:Trophy,c:'text-purple-400'},{to:'/changelogs',l:'Nouveautés',I:Sparkles,c:'text-blue-400'}].map(i => (
                <Link key={i.to} to={i.to} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-white/5 transition-colors" style={textStyle}><i.I className={`w-4 h-4 ${i.c}`} />{i.l}</Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
