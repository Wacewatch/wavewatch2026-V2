import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Music, Search, Shuffle, Repeat } from 'lucide-react';

const playlists = [
  {
    id: 'chill', name: 'Chill Vibes', color: 'from-blue-600 to-cyan-500',
    tracks: [
      { id: 1, title: 'Ocean Waves', artist: 'Nature Sounds', duration: '3:45', src: '' },
      { id: 2, title: 'Sunset Drive', artist: 'Lo-Fi Beats', duration: '4:12', src: '' },
      { id: 3, title: 'Midnight Rain', artist: 'Ambient Mix', duration: '5:30', src: '' },
    ]
  },
  {
    id: 'workout', name: 'Workout Mix', color: 'from-red-600 to-orange-500',
    tracks: [
      { id: 4, title: 'Power Up', artist: 'Electro Beats', duration: '3:20', src: '' },
      { id: 5, title: 'Run Fast', artist: 'EDM Crew', duration: '4:01', src: '' },
      { id: 6, title: 'Beast Mode', artist: 'Bass Drop', duration: '3:55', src: '' },
    ]
  },
  {
    id: 'study', name: 'Study Focus', color: 'from-purple-600 to-pink-500',
    tracks: [
      { id: 7, title: 'Deep Focus', artist: 'Piano Keys', duration: '6:10', src: '' },
      { id: 8, title: 'Concentration', artist: 'Binaural Beats', duration: '8:00', src: '' },
      { id: 9, title: 'Calm Mind', artist: 'Meditation Mix', duration: '5:45', src: '' },
    ]
  },
  {
    id: 'party', name: 'Party Hits', color: 'from-yellow-500 to-pink-500',
    tracks: [
      { id: 10, title: 'Dance Floor', artist: 'DJ Wave', duration: '3:30', src: '' },
      { id: 11, title: 'Neon Lights', artist: 'Synth Pop', duration: '4:15', src: '' },
      { id: 12, title: 'Weekend Vibes', artist: 'House Mix', duration: '3:50', src: '' },
    ]
  },
];

export default function MusicPage() {
  const [activePlaylist, setActivePlaylist] = useState(playlists[0]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [search, setSearch] = useState('');
  const [volume, setVolume] = useState(75);
  const [isMuted, setIsMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);

  const allTracks = playlists.flatMap(p => p.tracks.map(t => ({ ...t, playlist: p.name })));
  const filteredTracks = search ? allTracks.filter(t => t.title.toLowerCase().includes(search.toLowerCase()) || t.artist.toLowerCase().includes(search.toLowerCase())) : activePlaylist.tracks;

  const playTrack = (track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  const nextTrack = () => {
    const tracks = activePlaylist.tracks;
    const idx = tracks.findIndex(t => t.id === currentTrack?.id);
    if (shuffle) {
      const randomIdx = Math.floor(Math.random() * tracks.length);
      setCurrentTrack(tracks[randomIdx]);
    } else {
      setCurrentTrack(tracks[(idx + 1) % tracks.length]);
    }
  };

  const prevTrack = () => {
    const tracks = activePlaylist.tracks;
    const idx = tracks.findIndex(t => t.id === currentTrack?.id);
    setCurrentTrack(tracks[(idx - 1 + tracks.length) % tracks.length]);
  };

  return (
    <div className="container mx-auto px-4 py-8" data-testid="music-page">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><Music className="w-8 h-8 text-purple-400" />Musique</h1>
      <p className="text-muted-foreground mb-8">Ecoutez vos playlists preferees</p>

      {/* Search */}
      <div className="relative mb-8 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input type="text" placeholder="Rechercher une musique..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 h-10 rounded-lg border border-input bg-background outline-none" data-testid="music-search" />
      </div>

      {/* Playlists */}
      {!search && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {playlists.map(p => (
            <button key={p.id} onClick={() => setActivePlaylist(p)}
              className={`p-6 rounded-xl text-white text-left transition-all hover:scale-105 bg-gradient-to-br ${p.color} ${activePlaylist.id === p.id ? 'ring-2 ring-white shadow-lg' : 'opacity-80 hover:opacity-100'}`}
              data-testid={`playlist-${p.id}`}>
              <Music className="w-8 h-8 mb-3" />
              <h3 className="font-bold text-lg">{p.name}</h3>
              <p className="text-sm text-white/70">{p.tracks.length} titres</p>
            </button>
          ))}
        </div>
      )}

      {/* Track list */}
      <div className="bg-card border border-border rounded-xl overflow-hidden mb-24">
        <div className="p-4 border-b border-border">
          <h2 className="font-bold text-lg">{search ? 'Resultats de recherche' : activePlaylist.name}</h2>
          <p className="text-sm text-muted-foreground">{filteredTracks.length} titre{filteredTracks.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="divide-y divide-border">
          {filteredTracks.map((track, idx) => (
            <button key={track.id} onClick={() => playTrack(track)}
              className={`w-full flex items-center gap-4 p-4 text-left hover:bg-secondary/50 transition-colors ${currentTrack?.id === track.id ? 'bg-primary/10' : ''}`}
              data-testid={`track-${track.id}`}>
              <span className="w-8 text-center text-sm text-muted-foreground">
                {currentTrack?.id === track.id && isPlaying ? <span className="text-primary font-bold">&#9654;</span> : idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${currentTrack?.id === track.id ? 'text-primary' : ''}`}>{track.title}</p>
                <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
              </div>
              <span className="text-sm text-muted-foreground">{track.duration}</span>
            </button>
          ))}
        </div>
        {filteredTracks.length === 0 && <p className="text-center py-8 text-muted-foreground">Aucun resultat</p>}
      </div>

      {/* Player bar */}
      {currentTrack && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-3 z-50" data-testid="music-player-bar">
          <div className="container mx-auto flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate text-sm">{currentTrack.title}</p>
              <p className="text-xs text-muted-foreground truncate">{currentTrack.artist}</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setShuffle(!shuffle)} className={`p-1.5 rounded transition-colors ${shuffle ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                <Shuffle className="w-4 h-4" />
              </button>
              <button onClick={prevTrack} className="p-1.5 rounded hover:bg-secondary"><SkipBack className="w-5 h-5" /></button>
              <button onClick={() => setIsPlaying(!isPlaying)} className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center" data-testid="play-pause-btn">
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>
              <button onClick={nextTrack} className="p-1.5 rounded hover:bg-secondary"><SkipForward className="w-5 h-5" /></button>
              <button onClick={() => setRepeat(!repeat)} className={`p-1.5 rounded transition-colors ${repeat ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                <Repeat className="w-4 h-4" />
              </button>
            </div>
            <div className="hidden md:flex items-center gap-2 w-32">
              <button onClick={() => setIsMuted(!isMuted)} className="text-muted-foreground hover:text-foreground">
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input type="range" min="0" max="100" value={isMuted ? 0 : volume} onChange={e => { setVolume(Number(e.target.value)); setIsMuted(false); }}
                className="w-full h-1 rounded-lg appearance-none bg-muted accent-primary" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
