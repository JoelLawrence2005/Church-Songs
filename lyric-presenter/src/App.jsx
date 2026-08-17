import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Maximize, 
  Minimize, 
  Lock, 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  Music, 
  LogOut,
  RefreshCw
} from 'lucide-react';

const transposeChord = (chord, semitones) => {
  const scale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const flats = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };

  return chord.replace(/([A-G][b#]?)/g, (match) => {
    let normalized = flats[match] || match;
    let index = scale.indexOf(normalized);
    if (index === -1) return match;
    let newIndex = (index + semitones) % 12;
    if (newIndex < 0) newIndex += 12;
    return scale[newIndex];
  });
};

export default function App() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('list'); // 'list', 'view', 'admin'
  const [selectedSong, setSelectedSong] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [expandedSections, setExpandedSections] = useState({ English: true, Sinhala: true, Tamil: true });

  // Admin Auth State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [editingSong, setEditingSong] = useState(null);

  // Fetch songs from MongoDB via API Route
  const fetchSongs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/songs');
      if (res.ok) {
        const data = await res.json();
        setSongs(data);
      }
    } catch (err) {
      console.error("Failed to fetch songs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSongs();
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginForm.username === 'ICOC' && loginForm.password === 'ICOC@1234') {
      setIsAdminLoggedIn(true);
      setLoginError('');
      setLoginForm({ username: '', password: '' });
    } else {
      setLoginError('Invalid credentials');
    }
  };

  const handleSaveSong = async (songData) => {
    try {
      if (songData.id) {
        // Update existing song
        const res = await fetch('/api/songs', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(songData)
        });
        if (res.ok) {
          const updated = await res.json();
          setSongs(songs.map(s => s.id === updated.id ? updated : s));
        }
      } else {
        // Create new song
        const res = await fetch('/api/songs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(songData)
        });
        if (res.ok) {
          const created = await res.json();
          setSongs([...songs, created]);
        }
      }
      setEditingSong(null);
    } catch (err) {
      console.error("Error saving song:", err);
    }
  };

  const handleDeleteSong = async (id) => {
    if (!window.confirm('Are you sure you want to delete this song?')) return;
    try {
      const res = await fetch(`/api/songs?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSongs(songs.filter(s => s.id !== id));
      }
    } catch (err) {
      console.error("Error deleting song:", err);
    }
  };

  const languages = ['English', 'Sinhala', 'Tamil'];

  const filteredSongs = songs.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.slides.some(slide => slide.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-white text-black" style={{ color: '#000000', WebkitTextFillColor: '#000000' }}>
      {currentView === 'list' && (
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold tracking-tight">ICC Slides</h1>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setCurrentView('admin')}
                className="p-2 hover:bg-gray-100 rounded-full transition"
                title="Admin Panel"
              >
                <Lock size={20} />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search songs..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* Language Navigation */}
          <div className="flex gap-2 mb-8 border-b border-gray-100 pb-3">
            {languages.map(lang => (
              <button
                key={lang}
                onClick={() => {
                  setSelectedLanguage(lang);
                  const el = document.getElementById(`section-${lang}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`px-3 py-1 text-sm font-medium rounded-full transition ${
                  selectedLanguage === lang ? 'bg-black text-white' : 'text-black hover:bg-gray-100'
                }`}
                style={selectedLanguage === lang ? { color: '#ffffff', WebkitTextFillColor: '#ffffff' } : {}}
              >
                {lang}
              </button>
            ))}
          </div>

          {/* Song Lists by Language */}
          {loading ? (
            <div className="flex justify-center items-center py-20 text-gray-500">
              <RefreshCw className="animate-spin mr-2" size={20} /> Loading songs...
            </div>
          ) : (
            <div className="space-y-6">
              {languages.map(lang => {
                const langSongs = filteredSongs.filter(s => s.language === lang);
                const isExpanded = expandedSections[lang];

                return (
                  <div key={lang} id={`section-${lang}`} className="border-b border-gray-100 pb-4">
                    <button 
                      onClick={() => setExpandedSections(prev => ({ ...prev, [lang]: !prev[lang] }))}
                      className="flex justify-between items-center w-full py-2 text-left font-bold text-lg"
                    >
                      <span>{lang}</span>
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>

                    {isExpanded && (
                      <div className="mt-2 pl-2 space-y-1">
                        {langSongs.length === 0 ? (
                          <div className="text-gray-400 py-2 text-sm">No songs available</div>
                        ) : (
                          langSongs.map(song => (
                            <div 
                              key={song.id}
                              onClick={() => { setSelectedSong(song); setCurrentView('view'); }}
                              className="py-2 px-2 hover:bg-gray-50 rounded cursor-pointer transition text-black font-medium"
                            >
                              {song.title}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {currentView === 'view' && selectedSong && (
        <SongViewer 
          song={selectedSong} 
          onExit={() => { setCurrentView('list'); setSelectedSong(null); }} 
        />
      )}

      {currentView === 'admin' && (
        <AdminPanel 
          isLoggedIn={isAdminLoggedIn}
          onLogin={handleLogin}
          onLogout={() => setIsAdminLoggedIn(false)}
          loginForm={loginForm}
          setLoginForm={setLoginForm}
          loginError={loginError}
          songs={songs}
          onSave={handleSaveSong}
          onDelete={handleDeleteSong}
          editingSong={editingSong}
          setEditingSong={setEditingSong}
          onExit={() => setCurrentView('list')}
        />
      )}
    </div>
  );
}

function SongViewer({ song, onExit }) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showChords, setShowChords] = useState(true);
  const [capo, setCapo] = useState(0);
  const [fontScale, setFontScale] = useState(1);
  const [lineHeight, setLineHeight] = useState(1.4);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef(null);
  const viewerRef = useRef(null);

  const slides = [{ type: 'title', content: song.title }, ...song.slides.map(s => ({ type: 'lyrics', content: s }))];

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 2500);
  };

  const nextSlide = () => {
    if (currentSlideIndex < slides.length - 1) setCurrentSlideIndex(prev => prev + 1);
  };

  const prevSlide = () => {
    if (currentSlideIndex > 0) setCurrentSlideIndex(prev => prev - 1);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'Escape') onExit();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlideIndex, slides.length]);

  const renderSlideContent = (content) => {
    const lines = content.split('\n');
    return lines.map((line, lineIdx) => {
      const parts = line.split(/(\[[^\]]+\])/g);
      return (
        <div key={lineIdx} className="flex flex-wrap items-end justify-center min-h-[1.5em]">
          {parts.map((part, pIdx) => {
            if (part.startsWith('[') && part.endsWith(']')) {
              const chord = part.slice(1, -1);
              const transposed = transposeChord(chord, capo);
              return showChords ? (
                <span 
                  key={pIdx} 
                  className="font-bold relative text-red-600 block" 
                  style={{ color: '#dc2626', WebkitTextFillColor: '#dc2626', top: '-0.7em', margin: '0 2px' }}
                >
                  {transposed}
                </span>
              ) : null;
            }
            return (
              <span key={pIdx} className="whitespace-pre text-black font-semibold" style={{ color: '#000000', WebkitTextFillColor: '#000000' }}>
                {part}
              </span>
            );
          })}
        </div>
      );
    });
  };

  return (
    <div 
      ref={viewerRef}
      onMouseMove={handleMouseMove}
      className="fixed inset-0 bg-white z-50 flex flex-col justify-between select-none overflow-hidden"
    >
      {/* Top Bar Controls */}
      <div className={`p-4 flex justify-between items-center transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <button onClick={onExit} className="p-2 hover:bg-gray-100 rounded-full">
          <X size={24} />
        </button>
        <div className="flex items-center gap-4 bg-gray-100 px-4 py-2 rounded-full text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showChords} onChange={(e) => setShowChords(e.target.checked)} />
            Chords
          </label>
          <div className="flex items-center gap-1">
            <span>Capo: {capo}</span>
            <button onClick={() => setCapo(c => c - 1)} className="px-2 bg-white rounded shadow-sm">-</button>
            <button onClick={() => setCapo(c => c + 1)} className="px-2 bg-white rounded shadow-sm">+</button>
          </div>
          <div className="flex items-center gap-1">
            <span>A: {Math.round(fontScale * 100)}%</span>
            <button onClick={() => setFontScale(s => Math.max(0.6, s - 0.1))} className="px-2 bg-white rounded shadow-sm">-</button>
            <button onClick={() => setFontScale(s => Math.min(2.5, s + 0.1))} className="px-2 bg-white rounded shadow-sm">+</button>
          </div>
        </div>
      </div>

      {/* Main Slide Screen */}
      <div className="flex-1 flex items-center justify-center px-12 text-center">
        {slides[currentSlideIndex].type === 'title' ? (
          <h1 
            className="font-extrabold text-black"
            style={{ 
              fontSize: `calc(clamp(2.5rem, 6vw, 6rem) * ${fontScale})`,
              color: '#000000', 
              WebkitTextFillColor: '#000000' 
            }}
          >
            {slides[currentSlideIndex].content}
          </h1>
        ) : (
          <div 
            className="w-full"
            style={{ 
              fontSize: `calc(clamp(1.8rem, 4vw, 4rem) * ${fontScale})`,
              lineHeight: lineHeight,
              color: '#000000', 
              WebkitTextFillColor: '#000000' 
            }}
          >
            {renderSlideContent(slides[currentSlideIndex].content)}
          </div>
        )}
      </div>

      {/* Navigation Arrows */}
      <button 
        onClick={prevSlide} 
        disabled={currentSlideIndex === 0}
        className={`absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-gray-100/70 hover:bg-gray-200 rounded-full transition ${
          showControls && currentSlideIndex > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <ChevronLeft size={32} />
      </button>
      <button 
        onClick={nextSlide} 
        disabled={currentSlideIndex === slides.length - 1}
        className={`absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-gray-100/70 hover:bg-gray-200 rounded-full transition ${
          showControls && currentSlideIndex < slides.length - 1 ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <ChevronRight size={32} />
      </button>

      {/* Slide Indicators */}
      <div className="p-4 text-center text-xs text-gray-400">
        Slide {currentSlideIndex + 1} of {slides.length}
      </div>
    </div>
  );
}

function AdminPanel({ 
  isLoggedIn, 
  onLogin, 
  onLogout, 
  loginForm, 
  setLoginForm, 
  loginError, 
  songs, 
  onSave, 
  onDelete, 
  editingSong, 
  setEditingSong, 
  onExit 
}) {
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('English');
  const [slidesText, setSlidesText] = useState('');

  useEffect(() => {
    if (editingSong) {
      setTitle(editingSong.title);
      setLanguage(editingSong.language);
      setSlidesText(editingSong.slides.join('\n\n---\n\n'));
    } else {
      setTitle('');
      setLanguage('English');
      setSlidesText('');
    }
  }, [editingSong]);

  const handleSubmitSong = (e) => {
    e.preventDefault();
    const slides = slidesText.split(/\n\s*---\s*\n/).map(s => s.trim()).filter(Boolean);
    onSave({
      ...(editingSong?.id ? { id: editingSong.id } : {}),
      title,
      language,
      slides
    });
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <div className="border border-gray-200 p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Admin Login</h2>
            <button onClick={onExit}><X size={20} /></button>
          </div>
          <form onSubmit={onLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Username</label>
              <input 
                type="text" 
                value={loginForm.username} 
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                className="w-full border p-2 rounded-lg" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input 
                type="password" 
                value={loginForm.password} 
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="w-full border p-2 rounded-lg" 
                required 
              />
            </div>
            {loginError && <p className="text-red-500 text-sm">{loginError}</p>}
            <button type="submit" className="w-full bg-black text-white py-2 rounded-lg font-semibold hover:bg-gray-800 transition">
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <h2 className="text-2xl font-bold">Admin Dashboard</h2>
        <div className="flex gap-2">
          <button onClick={onLogout} className="px-3 py-2 border rounded-lg flex items-center gap-1 hover:bg-gray-50">
            <LogOut size={16} /> Logout
          </button>
          <button onClick={onExit} className="p-2 border rounded-lg hover:bg-gray-50">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Editor Form */}
        <div className="border p-6 rounded-xl bg-gray-50">
          <h3 className="text-lg font-bold mb-4">{editingSong ? 'Edit Song' : 'Add New Song'}</h3>
          <form onSubmit={handleSubmitSong} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Song Title</label>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                className="w-full border p-2 rounded-lg bg-white" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Language</label>
              <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value)} 
                className="w-full border p-2 rounded-lg bg-white"
              >
                <option value="English">English</option>
                <option value="Sinhala">Sinhala</option>
                <option value="Tamil">Tamil</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Lyrics & Chords (Separate slides with <code className="bg-gray-200 px-1 rounded">---</code>)
              </label>
              <textarea 
                rows="10" 
                value={slidesText} 
                onChange={(e) => setSlidesText(e.target.value)} 
                placeholder="[G]Amazing grace how [C]sweet the sound&#10;&#10;---&#10;&#10;[G]That saved a [D]wretch like me"
                className="w-full border p-2 rounded-lg bg-white font-mono text-sm" 
                required 
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-black text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2">
                <Save size={16} /> Save to Cloud
              </button>
              {editingSong && (
                <button type="button" onClick={() => setEditingSong(null)} className="px-4 py-2 border rounded-lg">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Existing Songs Management */}
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          <h3 className="text-lg font-bold mb-4">Manage Songs ({songs.length})</h3>
          {songs.map(song => (
            <div key={song.id} className="flex justify-between items-center p-3 border rounded-lg bg-white hover:border-black transition">
              <div>
                <p className="font-semibold">{song.title}</p>
                <span className="text-xs text-gray-500">{song.language} • {song.slides.length} slides</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setEditingSong(song)} className="p-2 hover:bg-gray-100 rounded text-blue-600">
                  <Edit size={16} />
                </button>
                <button onClick={() => handleDeleteSong(song.id)} className="p-2 hover:bg-gray-100 rounded text-red-600">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}