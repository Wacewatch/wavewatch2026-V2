import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { Search, Menu, X, User, LogOut, Crown, Shield, ChevronDown, Palette } from 'lucide-react';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [contentOpen, setContentOpen] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { theme, setTheme, THEMES, LIMITED_THEMES, PREMIUM_THEMES } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsMenuOpen(false);
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

  const navStyle = { backgroundColor: 'hsl(var(--nav-bg))', borderColor: 'hsl(var(--nav-border))' };
  const textStyle = { color: 'hsl(var(--nav-text))' };
  const textSecStyle = { color: 'hsl(var(--nav-text-secondary))' };
  const dropBg = { backgroundColor: 'hsl(var(--nav-dropdown-bg))', borderColor: 'hsl(var(--nav-border))' };

  const DropdownItem = ({ to, children, onClick, external, badge }) => {
    const cls = "block w-full text-left px-4 py-2 text-sm hover:opacity-80 transition-opacity flex items-center justify-between";
    if (external) return (
      <a href={to} target="_blank" rel="noopener noreferrer" className={cls} style={textStyle} onClick={() => { setContentOpen(false); setMediaOpen(false); }}>
        {children}{badge && <span className="ml-2 px-2 py-0.5 text-xs font-bold text-white rounded bg-gradient-to-r from-yellow-500 to-orange-500">{badge}</span>}
      </a>
    );
    if (onClick) return <button className={cls} style={textStyle} onClick={onClick}>{children}</button>;
    return (
      <Link to={to} className={cls} style={textStyle} onClick={() => { setContentOpen(false); setMediaOpen(false); }}>
        {children}{badge && <span className="ml-2 px-2 py-0.5 text-xs font-bold text-white rounded bg-gradient-to-r from-yellow-500 to-orange-500">{badge}</span>}
      </Link>
    );
  };

  return (
    <nav className="sticky top-0 z-50 border-b" style={navStyle} data-testid="main-navigation">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link to="/" className="flex items-center flex-shrink-0 group" data-testid="logo-link">
            <span className="text-xl md:text-2xl font-black tracking-tight bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
              WaveWatch
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center space-x-6">
            <div className="relative">
              <button onClick={() => { setContentOpen(!contentOpen); setMediaOpen(false); }} className="flex items-center font-medium transition-all" style={textStyle} data-testid="content-dropdown">
                Contenu <ChevronDown className="w-4 h-4 ml-1" />
              </button>
              {contentOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 rounded-lg border shadow-xl py-1 z-50" style={dropBg}>
                  <DropdownItem to="/movies">Films</DropdownItem>
                  <DropdownItem to="/tv-shows">Series</DropdownItem>
                  <DropdownItem to="/anime">Animes</DropdownItem>
                  <DropdownItem to="/collections">Collections</DropdownItem>
                  <div className="border-t my-1" style={{ borderColor: 'hsl(var(--nav-border))' }} />
                  <DropdownItem to="/ebooks" badge="NEW">Ebooks</DropdownItem>
                  <DropdownItem to="/logiciels" badge="NEW">Logiciels</DropdownItem>
                </div>
              )}
            </div>
            <div className="relative">
              <button onClick={() => { setMediaOpen(!mediaOpen); setContentOpen(false); }} className="flex items-center font-medium transition-all" style={textStyle} data-testid="media-dropdown">
                Medias <ChevronDown className="w-4 h-4 ml-1" />
              </button>
              {mediaOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 rounded-lg border shadow-xl py-1 z-50" style={dropBg}>
                  <DropdownItem to="/tv-channels">Chaines TV</DropdownItem>
                  <DropdownItem to="/radio">Radio FM</DropdownItem>
                  <DropdownItem to="/retrogaming">Retrogaming</DropdownItem>
                  <DropdownItem to="/discover/playlists">Decouvrir des Playlists</DropdownItem>
                  <DropdownItem to="/requests">Demandes de contenu</DropdownItem>
                </div>
              )}
            </div>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={textSecStyle} />
              <input type="text" placeholder="Rechercher..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 h-11 rounded-full border transition-colors outline-none"
                style={{ backgroundColor: 'hsl(var(--nav-hover))', borderColor: 'hsl(var(--nav-border))', color: 'hsl(var(--nav-text))' }}
                data-testid="search-input" />
            </div>
          </form>

          {/* Right side */}
          <div className="flex items-center space-x-2 md:space-x-3">
            {/* Theme picker */}
            <div className="relative">
              <button onClick={() => setThemeOpen(!themeOpen)} className="h-10 w-10 rounded-full border-2 flex items-center justify-center transition-colors hover:opacity-80"
                style={{ borderColor: 'hsl(var(--nav-border))' }} data-testid="theme-picker-btn">
                <Palette className="w-4 h-4" style={textStyle} />
              </button>
              {themeOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 max-h-96 overflow-y-auto rounded-lg border shadow-xl p-3 z-50" style={dropBg}>
                  <p className="text-xs font-semibold mb-2 px-1" style={textStyle}>Themes Standard</p>
                  <div className="grid grid-cols-2 gap-1.5 mb-3">
                    {THEMES.map(t => (
                      <button key={t.id} onClick={() => handleThemeChange(t.id)}
                        className={`flex items-center gap-2 p-2 rounded-lg transition-colors hover:opacity-80 ${theme === t.id ? 'ring-2 ring-blue-500' : ''}`}>
                        <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${t.gradient}`} />
                        <span className="text-xs" style={textStyle}>{t.name}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs font-semibold mb-2 px-1" style={textStyle}>Limites</p>
                  <div className="grid grid-cols-2 gap-1.5 mb-3">
                    {LIMITED_THEMES.map(t => (
                      <button key={t.id} onClick={() => handleThemeChange(t.id)}
                        className={`flex items-center gap-2 p-2 rounded-lg transition-colors hover:opacity-80 ${theme === t.id ? 'ring-2 ring-blue-500' : ''}`}>
                        <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${t.gradient}`} />
                        <span className="text-xs" style={textStyle}>{t.name}</span>
                      </button>
                    ))}
                  </div>
                  {user && (<>
                    <p className="text-xs font-semibold mb-2 px-1 flex items-center" style={textStyle}>
                      Premium {!user.is_vip && !user.is_vip_plus && !user.is_admin && <Crown className="w-3 h-3 ml-1 text-yellow-400" />}
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {PREMIUM_THEMES.map(t => (
                        <button key={t.id} onClick={() => handleThemeChange(t.id, t.requiresVip, t.requiresVipPlus)}
                          className={`flex items-center gap-2 p-2 rounded-lg transition-colors hover:opacity-80 relative ${theme === t.id ? 'ring-2 ring-blue-500' : ''} ${
                            (t.requiresVipPlus && !user.is_vip_plus && !user.is_admin) || (t.requiresVip && !user.is_vip && !user.is_vip_plus && !user.is_admin) ? 'opacity-50' : ''
                          }`}>
                          <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${t.gradient}`} />
                          <span className="text-xs" style={textStyle}>{t.name}</span>
                        </button>
                      ))}
                    </div>
                  </>)}
                </div>
              )}
            </div>

            {/* User menu */}
            {user ? (
              <div className="relative">
                <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="relative h-10 w-10 rounded-full border-2 flex items-center justify-center transition-colors hover:opacity-80"
                  style={{ borderColor: 'hsl(var(--nav-border))' }} data-testid="user-menu-btn">
                  <User className="w-4 h-4" style={textStyle} />
                  {user.is_vip && <Crown className="w-3 h-3 absolute -top-1 -right-1 text-yellow-400" />}
                  {user.is_admin && <Shield className="w-2.5 h-2.5 absolute top-0 left-0 text-red-400" />}
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border shadow-xl py-1 z-50" style={dropBg}>
                    <div className="px-4 py-2 border-b" style={{ borderColor: 'hsl(var(--nav-border))' }}>
                      <p className="text-sm font-medium" style={textStyle}>{user.username || 'Utilisateur'}</p>
                      <p className="text-xs" style={textSecStyle}>
                        {user.is_admin ? 'Administrateur' : user.is_vip_plus ? 'VIP Plus' : user.is_vip ? 'VIP' : 'Standard'}
                      </p>
                    </div>
                    <DropdownItem to="/dashboard">Tableau de bord</DropdownItem>
                    <DropdownItem to="/favorites">Mes favoris</DropdownItem>
                    <DropdownItem to="/playlists">Mes playlists</DropdownItem>
                    <DropdownItem to="/profile">Profil</DropdownItem>
                    {!user.is_vip && <DropdownItem to="/subscription"><span className="text-yellow-400 flex items-center"><Crown className="w-4 h-4 mr-2" />Devenir VIP</span></DropdownItem>}
                    {(user.is_admin || user.is_uploader) && (
                      <DropdownItem to="/admin"><span className="text-red-400 flex items-center"><Shield className="w-4 h-4 mr-2" />Administration</span></DropdownItem>
                    )}
                    <DropdownItem onClick={() => { handleSignOut(); setUserMenuOpen(false); }}>
                      <span className="flex items-center"><LogOut className="w-4 h-4 mr-2" />Deconnexion</span>
                    </DropdownItem>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Link to="/login" className="px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:opacity-80" style={textStyle} data-testid="login-btn">Connexion</Link>
                <Link to="/register" className="px-4 py-2 text-sm font-medium rounded-lg" style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }} data-testid="register-btn">Inscription</Link>
              </div>
            )}

            {/* Mobile menu btn */}
            <button className="h-10 w-10 lg:hidden flex items-center justify-center" onClick={() => setIsMenuOpen(!isMenuOpen)} data-testid="mobile-menu-btn">
              {isMenuOpen ? <X className="w-5 h-5" style={textStyle} /> : <Menu className="w-5 h-5" style={textStyle} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden overflow-y-auto" style={{ backgroundColor: 'hsl(var(--nav-bg) / 0.98)' }}>
          <div className="container mx-auto px-4 py-6">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xl font-black bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">WaveWatch</span>
              <button onClick={() => setIsMenuOpen(false)}><X className="w-6 h-6" style={textStyle} /></button>
            </div>
            <form onSubmit={handleSearch} className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={textSecStyle} />
                <input type="text" placeholder="Rechercher..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 h-10 rounded-lg border outline-none" style={{ backgroundColor: 'hsl(var(--nav-hover))', borderColor: 'hsl(var(--nav-border))', color: 'hsl(var(--nav-text))' }} />
              </div>
            </form>
            {!user ? (
              <div className="flex flex-col space-y-2 mb-6">
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="w-full py-2.5 text-center rounded-lg font-medium" style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>Connexion</Link>
                <Link to="/register" onClick={() => setIsMenuOpen(false)} className="w-full py-2.5 text-center rounded-lg border font-medium" style={{ borderColor: 'hsl(var(--nav-border))', color: 'hsl(var(--nav-text))' }}>Inscription</Link>
              </div>
            ) : (
              <div className="mb-6 space-y-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--nav-hover))' }}><User className="w-5 h-5" style={textStyle} /></div>
                  <div><p className="font-medium" style={textStyle}>{user.username}</p><p className="text-xs" style={textSecStyle}>{user.is_admin ? 'Admin' : 'Membre'}</p></div>
                </div>
                {[{to:'/dashboard',label:'Tableau de bord'},{to:'/favorites',label:'Mes favoris'},{to:'/playlists',label:'Mes playlists'},{to:'/profile',label:'Profil'}].map(l => (
                  <Link key={l.to} to={l.to} onClick={() => setIsMenuOpen(false)} className="block py-2 px-3 rounded-lg hover:opacity-80" style={textStyle}>{l.label}</Link>
                ))}
                {(user.is_admin || user.is_uploader) && <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="block py-2 px-3 rounded-lg text-red-400">Administration</Link>}
                <button onClick={handleSignOut} className="block w-full text-left py-2 px-3 rounded-lg hover:opacity-80" style={textStyle}>Deconnexion</button>
              </div>
            )}
            <div className="border-t pt-4 space-y-1" style={{ borderColor: 'hsl(var(--nav-border))' }}>
              <p className="text-sm font-semibold mb-2" style={textStyle}>Contenu</p>
              {[{to:'/movies',l:'Films'},{to:'/tv-shows',l:'Series'},{to:'/anime',l:'Animes'},{to:'/collections',l:'Collections'},{to:'/ebooks',l:'Ebooks'},{to:'/logiciels',l:'Logiciels'}].map(i => (
                <Link key={i.to} to={i.to} onClick={() => setIsMenuOpen(false)} className="block py-2 px-3 rounded-lg hover:opacity-80" style={textStyle}>{i.l}</Link>
              ))}
            </div>
            <div className="border-t pt-4 mt-4 space-y-1" style={{ borderColor: 'hsl(var(--nav-border))' }}>
              <p className="text-sm font-semibold mb-2" style={textStyle}>Medias</p>
              {[{to:'/tv-channels',l:'Chaines TV'},{to:'/radio',l:'Radio FM'},{to:'/retrogaming',l:'Retrogaming'},{to:'/discover/playlists',l:'Playlists publiques'},{to:'/requests',l:'Demandes'}].map(i => (
                <Link key={i.to} to={i.to} onClick={() => setIsMenuOpen(false)} className="block py-2 px-3 rounded-lg hover:opacity-80" style={textStyle}>{i.l}</Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
