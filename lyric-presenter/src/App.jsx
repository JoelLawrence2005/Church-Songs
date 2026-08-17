import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Lock, 
  Trash2, 
  Edit, 
  Save, 
  LogOut,
  RefreshCw,
  Eye,
  EyeOff,
  DownloadCloud,
  Link
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
  const [currentView, setCurrentView] = useState('list');
  const [selectedSong, setSelectedSong] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [expandedSections, setExpandedSections] = useState({ English: true, Sinhala: true, Tamil: true });

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [editingSong, setEditingSong] = useState(null);

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
      setLoginError('Invalid username or password');
    }
  };

  const handleSaveSong = async (songData) => {
    try {
      if (songData.id) {
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
    (s.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.slides || []).some(slide => slide.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans antialiased">
      {/* MAIN VIEW */}
      {currentView === 'list' && (
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-extrabold tracking-tight text-black">ICC Slides</h1>
            <button 
              onClick={() => setCurrentView('admin')}
              className="p-2.5 rounded-full border border-gray-300 hover:bg-gray-100 text-black transition flex items-center gap-1.5 text-sm font-semibold"
            >
              <Lock size={18} className="text-black" />
              <span>Admin</span>
            </button>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input 
              type="text" 
              placeholder="Search by song title or lyric..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition"
            />
          </div>

          <div className="flex gap-2 mb-8 pb-3 border-b border-gray-200 overflow-x-auto">
            {languages.map(lang => (
              <button
                key={lang}
                onClick={() => {
                  setSelectedLanguage(lang);
                  const el = document.getElementById(`section-${lang}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition ${
                  selectedLanguage === lang 
                    ? 'bg-black text-white' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-24 text-gray-600 font-medium">
              <RefreshCw className="animate-spin mr-2" size={22} /> Loading song library...
            </div>
          ) : (
            <div className="space-y-6">
              {languages.map(lang => {
                const langSongs = filteredSongs.filter(s => s.language === lang);
                const isExpanded = expandedSections[lang];

                return (
                  <div key={lang} id={`section-${lang}`} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    <button 
                      onClick={() => setExpandedSections(prev => ({ ...prev, [lang]: !prev[lang] }))}
                      className="flex justify-between items-center w-full px-5 py-4 bg-gray-50 hover:bg-gray-100 transition text-left"
                    >
                      <span className="text-xl font-bold text-black">{lang}</span>
                      <span className="text-sm font-semibold text-gray-500 flex items-center gap-2">
                        {langSongs.length} {langSongs.length === 1 ? 'song' : 'songs'}
                        {isExpanded ? <ChevronUp size={20} className="text-black" /> : <ChevronDown size={20} className="text-black" />}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="divide-y divide-gray-100">
                        {langSongs.length === 0 ? (
                          <div className="p-5 text-gray-500 text-sm italic">No songs listed in {lang} yet.</div>
                        ) : (
                          langSongs.map(song => (
                            <div 
                              key={song.id}
                              onClick={() => { setSelectedSong(song); setCurrentView('view'); }}
                              className="px-5 py-3.5 hover:bg-gray-50 cursor-pointer transition text-black font-semibold text-base flex justify-between items-center"
                            >
                              <span>{song.title}</span>
                              <ChevronRight size={18} className="text-gray-400" />
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

      {/* SONG VIEWER */}
      {currentView === 'view' && selectedSong && (
        <SongViewer 
          song={selectedSong} 
          onExit={() => { setCurrentView('list'); setSelectedSong(null); }} 
        />
      )}

      {/* ADMIN PANEL */}
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
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef(null);

  const slides = [{ type: 'title', content: song.title }, ...(song.slides || []).map(s => ({ type: 'lyrics', content: s }))];

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
  };

  const nextSlide = () => {
    if (currentSlideIndex < slides.length - 1) setCurrentSlideIndex(prev => prev + 1);
  };

  const prevSlide = () => {
    if (currentSlideIndex > 0) setCurrentSlideIndex(prev => prev - 1);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') nextSlide();
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') prevSlide();
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
        <div key={lineIdx} className="flex flex-wrap items-end justify-center my-2 min-h-[1.6em]">
          {parts.map((part, pIdx) => {
            if (part.startsWith('[') && part.endsWith(']')) {
              const chord = part.slice(1, -1);
              const transposed = transposeChord(chord, capo);
              return showChords ? (
                <span 
                  key={pIdx} 
                  className="font-bold relative text-red-600 inline-block px-0.5" 
                  style={{ color: '#dc2626', top: '-0.7em' }}
                >
                  {transposed}
                </span>
              ) : null;
            }
            return (
              <span key={pIdx} className="whitespace-pre text-black font-bold">
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
      onMouseMove={handleMouseMove}
      className="fixed inset-0 bg-white z-50 flex flex-col justify-between select-none overflow-hidden"
    >
      <div className={`p-4 flex justify-between items-center transition-opacity duration-300 bg-gradient-to-b from-white/90 to-transparent ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <button 
          onClick={onExit} 
          className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-full text-black transition shadow-sm pointer-events-auto"
        >
          <X size={24} className="text-black" />
        </button>

        <div className="flex items-center gap-3 bg-white border border-gray-300 px-4 py-2 rounded-full shadow-md pointer-events-auto">
          <button 
            onClick={() => setShowChords(!showChords)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold transition ${
              showChords ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {showChords ? <Eye size={16} /> : <EyeOff size={16} />}
            <span>Chords</span>
          </button>

          <div className="h-4 w-px bg-gray-300" />

          <div className="flex items-center gap-1.5 text-sm font-bold text-gray-800">
            <span>Capo {capo}</span>
            <button onClick={() => setCapo(c => c - 1)} className="w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded text-black font-bold flex items-center justify-center">-</button>
            <button onClick={() => setCapo(c => c + 1)} className="w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded text-black font-bold flex items-center justify-center">+</button>
          </div>

          <div className="h-4 w-px bg-gray-300" />

          <div className="flex items-center gap-1.5 text-sm font-bold text-gray-800">
            <span>A</span>
            <button onClick={() => setFontScale(s => Math.max(0.6, Number((s - 0.1).toFixed(1))))} className="w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded text-black font-bold flex items-center justify-center">-</button>
            <span className="text-xs text-gray-600 min-w-[36px] text-center">{Math.round(fontScale * 100)}%</span>
            <button onClick={() => setFontScale(s => Math.min(2.5, Number((s + 0.1).toFixed(1))))} className="w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded text-black font-bold flex items-center justify-center">+</button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-12 text-center overflow-auto">
        {slides[currentSlideIndex].type === 'title' ? (
          <h1 
            className="font-extrabold text-black tracking-tight"
            style={{ fontSize: `calc(clamp(2.5rem, 6vw, 5.5rem) * ${fontScale})` }}
          >
            {slides[currentSlideIndex].content}
          </h1>
        ) : (
          <div 
            className="w-full text-black"
            style={{ fontSize: `calc(clamp(1.8rem, 4.2vw, 3.8rem) * ${fontScale})` }}
          >
            {renderSlideContent(slides[currentSlideIndex].content)}
          </div>
        )}
      </div>

      <button 
        onClick={prevSlide} 
        disabled={currentSlideIndex === 0}
        className={`absolute left-5 top-1/2 -translate-y-1/2 p-4 bg-white border border-gray-300 rounded-full shadow-lg text-black transition hover:bg-gray-100 ${
          showControls && currentSlideIndex > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <ChevronLeft size={36} className="text-black" />
      </button>

      <button 
        onClick={nextSlide} 
        disabled={currentSlideIndex === slides.length - 1}
        className={`absolute right-5 top-1/2 -translate-y-1/2 p-4 bg-white border border-gray-300 rounded-full shadow-lg text-black transition hover:bg-gray-100 ${
          showControls && currentSlideIndex < slides.length - 1 ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <ChevronRight size={36} className="text-black" />
      </button>

      <div className="p-4 text-center text-sm font-semibold text-gray-500">
        {currentSlideIndex + 1} / {slides.length}
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
  const [ugUrl, setUgUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState('');

  useEffect(() => {
    if (editingSong) {
      setTitle(editingSong.title || '');
      setLanguage(editingSong.language || 'English');
      setSlidesText((editingSong.slides || []).join('\n\n---\n\n'));
    } else {
      setTitle('');
      setLanguage('English');
      setSlidesText('');
    }
  }, [editingSong]);

  const handleImportUG = async (e) => {
    e.preventDefault();
    if (!ugUrl.trim()) return;

    setIsImporting(true);
    setImportStatus('Fetching chords from Ultimate Guitar...');

    try {
      const res = await fetch('/api/import-ug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: ugUrl })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Import failed');
      }

      setTitle(data.title || title);
      setSlidesText(data.slidesText || '');
      setImportStatus('Successfully imported! Review slides below before saving.');
      setUgUrl('');
    } catch (err) {
      setImportStatus('Error: ' + err.message);
    } finally {
      setIsImporting(false);
    }
  };

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
        <div className="border border-gray-300 bg-white p-8 rounded-2xl shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-black">Admin Access</h2>
            <button onClick={onExit} className="p-1 hover:bg-gray-100 rounded-full text-black">
              <X size={22} />
            </button>
          </div>
          <form onSubmit={onLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1.5">Username</label>
              <input 
                type="text" 
                value={loginForm.username} 
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                className="w-full border border-gray-300 p-3 rounded-lg text-black bg-white focus:ring-2 focus:ring-black focus:outline-none" 
                placeholder="Enter username"
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1.5">Password</label>
              <input 
                type="password" 
                value={loginForm.password} 
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="w-full border border-gray-300 p-3 rounded-lg text-black bg-white focus:ring-2 focus:ring-black focus:outline-none" 
                placeholder="Enter password"
                required 
              />
            </div>
            {loginError && <p className="text-red-600 font-semibold text-sm">{loginError}</p>}
            <button 
              type="submit" 
              className="w-full bg-black hover:bg-gray-900 text-white font-bold py-3 rounded-lg transition shadow-sm mt-2"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-2xl font-extrabold text-black">Song Library Manager</h2>
          <p className="text-sm text-gray-500">Connected to MongoDB Cloud</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={onLogout} 
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-bold text-black hover:bg-gray-100 flex items-center gap-1.5"
          >
            <LogOut size={16} /> Logout
          </button>
          <button 
            onClick={onExit} 
            className="p-2 border border-gray-300 rounded-lg text-black hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Container */}
        <div className="lg:col-span-6 border border-gray-300 p-6 rounded-2xl bg-white shadow-sm">
          <h3 className="text-xl font-bold text-black mb-4">
            {editingSong ? 'Edit Song' : 'Add New Song'}
          </h3>

          {/* Ultimate Guitar Import Box */}
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Link size={14} className="text-gray-500" /> Auto-Import via Ultimate Guitar
            </label>
            <div className="flex gap-2">
              <input 
                type="url" 
                value={ugUrl}
                onChange={(e) => setUgUrl(e.target.value)}
                placeholder="https://tabs.ultimate-guitar.com/tab/..."
                className="flex-1 border border-gray-300 p-2 text-xs rounded-lg bg-white text-black"
              />
              <button 
                onClick={handleImportUG}
                disabled={isImporting || !ugUrl}
                className="bg-black text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-gray-800 disabled:opacity-50 flex items-center gap-1"
              >
                {isImporting ? <RefreshCw className="animate-spin" size={14} /> : <DownloadCloud size={14} />}
                Import
              </button>
            </div>
            {importStatus && (
              <p className={`text-xs mt-2 font-medium ${importStatus.startsWith('Error') ? 'text-red-600' : 'text-emerald-600'}`}>
                {importStatus}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmitSong} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1.5">Song Title</label>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                className="w-full border border-gray-300 p-2.5 rounded-lg text-black bg-white focus:ring-2 focus:ring-black focus:outline-none" 
                placeholder="e.g. Amazing Grace"
                required 
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1.5">Language</label>
              <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value)} 
                className="w-full border border-gray-300 p-2.5 rounded-lg text-black bg-white focus:ring-2 focus:ring-black focus:outline-none"
              >
                <option value="English">English</option>
                <option value="Sinhala">Sinhala</option>
                <option value="Tamil">Tamil</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1">
                Lyrics & Chords
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Use brackets for chords like <span className="font-mono text-red-600">[G]</span>. Separate slides using <span className="font-mono bg-gray-100 px-1 py-0.5 rounded text-black border font-bold">---</span>
              </p>
              <textarea 
                rows="10" 
                value={slidesText} 
                onChange={(e) => setSlidesText(e.target.value)} 
                placeholder="[G]Amazing grace how [C]sweet the sound&#10;&#10;---&#10;&#10;[G]That saved a [D]wretch like me"
                className="w-full border border-gray-300 p-3 rounded-lg text-black bg-white font-mono text-sm focus:ring-2 focus:ring-black focus:outline-none" 
                required 
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                type="submit" 
                className="flex-1 bg-black hover:bg-gray-800 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition"
              >
                <Save size={18} />
                <span>{editingSong ? 'Update Song' : 'Save to Cloud'}</span>
              </button>
              {editingSong && (
                <button 
                  type="button" 
                  onClick={() => setEditingSong(null)} 
                  className="px-5 py-3 border border-gray-300 text-black font-bold rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Existing Songs List */}
        <div className="lg:col-span-6 border border-gray-300 p-6 rounded-2xl bg-white shadow-sm flex flex-col h-[650px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-black">Songs in Database</h3>
            <span className="text-xs font-bold bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">{songs.length} Total</span>
          </div>

          <div className="overflow-y-auto divide-y divide-gray-100 flex-1 pr-1">
            {songs.length === 0 ? (
              <p className="text-gray-500 text-sm italic py-8 text-center">No songs stored in MongoDB yet.</p>
            ) : (
              songs.map(song => (
                <div key={song.id} className="py-3 flex justify-between items-center hover:bg-gray-50 px-2 rounded-lg transition">
                  <div>
                    <h4 className="font-bold text-black text-base">{song.title}</h4>
                    <p className="text-xs text-gray-500 font-medium">{song.language} • {(song.slides || []).length} slides</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setEditingSong(song)} 
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => handleDeleteSong(song.id)} 
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}