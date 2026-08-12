import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, Sun, Moon, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, 
  Maximize, Minimize, Play, X, Music, Lock, Plus, Edit2, Trash2, Save, LogOut 
} from 'lucide-react';

const INITIAL_SONGS = [
  {
    id: "song-1",
    language: "English",
    title: "Above All Powers",
    slides: [
      { type: "title", text: "Above All Powers" },
      { type: "lyric", text: "[G]Above all [C]powers, [D]above all [G]kings\n[G]Above all [C]nature and [D]all created [G]things\n[Em]Above all [D]wisdom and [C]all the [G/B]ways of man\n[Am]You were here [Am/G]before the world be[D/F#]gan" }
    ]
  },
  {
    id: "song-2",
    language: "English",
    title: "Amazing Grace",
    slides: [
      { type: "title", text: "Amazing Grace" },
      { type: "lyric", text: "[G]Amazing grace! (how [C]sweet the [G]sound)\nThat [G]saved a wretch like [D]me!\nI [G]once was lost, but [C]now am [G]found,\nWas [Em]blind, but [D]now I [G]see." }
    ]
  }
];

const LANGUAGES = ['English', 'Sinhala', 'Tamil'];

const transposeChord = (chord, steps) => {
  if (!steps) return chord;
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const flats = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  
  const match = chord.match(/^([CDEFGAB][b#]?)(.*)$/);
  if (!match) return chord;
  
  const root = match[1];
  const suffix = match[2];
  
  let index = notes.indexOf(root);
  if (index === -1) index = flats.indexOf(root);
  if (index === -1) return chord;
  
  let newIndex = (index + steps) % 12;
  if (newIndex < 0) newIndex += 12;
  
  return notes[newIndex] + suffix;
};

const SongViewer = ({ song, onExit, globalShowChords, setGlobalShowChords }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mouseActive, setMouseActive] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [capo, setCapo] = useState(0);
  const [fontScale, setFontScale] = useState(1);
  const [lineHeight, setLineHeight] = useState(1.5);
  const viewerRef = useRef(null);

  const nextSlide = () => setCurrentSlide(prev => Math.min(prev + 1, song.slides.length - 1));
  const prevSlide = () => setCurrentSlide(prev => Math.max(prev - 1, 0));

  const handleExit = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    onExit();
  };

  const toggleFullscreen = (e) => {
    if (e) e.stopPropagation();
    if (!document.fullscreenElement) {
      if (viewerRef.current?.requestFullscreen) {
        viewerRef.current.requestFullscreen().catch(err => console.warn(err));
      } else if (viewerRef.current?.webkitRequestFullscreen) {
        viewerRef.current.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => console.warn(err));
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  };

  const increaseFont = (e) => { e.stopPropagation(); e.currentTarget.blur(); setFontScale(s => Math.min(2.5, Math.round((s + 0.1)*10)/10)); };
  const decreaseFont = (e) => { e.stopPropagation(); e.currentTarget.blur(); setFontScale(s => Math.max(0.5, Math.round((s - 0.1)*10)/10)); };
  
  const increaseLineHeight = (e) => { e.stopPropagation(); e.currentTarget.blur(); setLineHeight(l => Math.min(3.0, Math.round((l + 0.1)*10)/10)); };
  const decreaseLineHeight = (e) => { e.stopPropagation(); e.currentTarget.blur(); setLineHeight(l => Math.max(1.0, Math.round((l - 0.1)*10)/10)); };

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        prevSlide();
      } else if (e.key === 'Escape') {
        if (!document.fullscreenElement) {
          onExit();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, onExit, song.slides.length]);

  useEffect(() => {
    let timeout;
    const handleMouseMove = () => {
      setMouseActive(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setMouseActive(false), 2000);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, []);

  const slide = song.slides[currentSlide];

  const renderLyricLine = (line) => {
    if (!globalShowChords || !line.includes('[')) {
      return <div className="min-h-[1.5em]" style={{ lineHeight: lineHeight }}>{line.replace(/\[.*?\]/g, '')}</div>;
    }

    const parts = line.split(/\[(.*?)\]/);
    const segments = [];

    for (let i = 0; i < parts.length; i += 2) {
      const lyric = parts[i];
      const rawChord = i > 0 ? parts[i - 1] : null;
      const transposedChord = rawChord ? transposeChord(rawChord, capo) : null;

      if (!rawChord && !lyric) continue;

      segments.push(
        <span key={i} className="inline-flex flex-col justify-end whitespace-pre text-left">
          <span className="text-blue-600 font-bold text-[0.45em] leading-none mb-2 h-[1em]">
            {transposedChord || ''}
          </span>
          <span style={{ lineHeight: lineHeight }}>{lyric || ''}</span>
        </span>
      );
    }
    return <div className="flex flex-wrap justify-center items-end">{segments}</div>;
  };

  const uiBg = 'bg-white border-gray-200 text-black shadow-sm';
  const btnHover = 'hover:bg-gray-100';
  const iconColor = 'text-black';

  return (
    <div 
      ref={viewerRef}
      className={`fixed inset-0 z-[100] flex flex-col font-sans transition-all duration-300 ${mouseActive ? 'cursor-default' : 'cursor-none'} bg-white text-black`}
    >
      {/* Top Header Controls */}
      <div className={`absolute top-0 left-0 right-0 p-4 flex flex-wrap justify-between items-center z-30 transition-opacity duration-300 ${mouseActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className={`font-medium flex items-center gap-2 ${iconColor}`}>
          <button onClick={handleExit} className={`p-2 rounded-full transition-colors mr-2 ${btnHover} bg-gray-50`}>
             <ChevronLeft className="w-6 h-6" />
          </button>
          <span className="text-lg hidden sm:inline font-bold text-black">{song.title}</span>
          <span className="opacity-50 mx-2 hidden sm:inline text-black">|</span>
          <span className="text-sm font-medium text-black">Slide {currentSlide + 1} of {song.slides.length}</span>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          
          {/* Font Controls */}
          <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full backdrop-blur-md border ${uiBg}`} onClick={(e) => e.stopPropagation()}>
            <span className="text-xs font-bold opacity-70 mr-1">A</span>
            <button onClick={decreaseFont} className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${btnHover}`}>-</button>
            <span className="w-10 text-center text-sm font-bold">{Math.round(fontScale * 100)}%</span>
            <button onClick={increaseFont} className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${btnHover}`}>+</button>
          </div>
          
          {/* Line Height Controls */}
          <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full backdrop-blur-md border hidden md:flex ${uiBg}`} onClick={(e) => e.stopPropagation()}>
            <span className="text-xs font-bold opacity-70 mr-1">↕</span>
            <button onClick={decreaseLineHeight} className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${btnHover}`}>-</button>
            <span className="w-6 text-center text-sm font-bold">{lineHeight.toFixed(1)}</span>
            <button onClick={increaseLineHeight} className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${btnHover}`}>+</button>
          </div>

          {/* Chord Controls */}
          <div 
            className={`flex items-center gap-3 px-4 py-1.5 rounded-full backdrop-blur-md border ${uiBg}`}
            onClick={(e) => e.stopPropagation()}
          >
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
              <input 
                type="checkbox" 
                checked={globalShowChords} 
                onChange={(e) => setGlobalShowChords(e.target.checked)}
                className="w-4 h-4 rounded bg-black/10 border-transparent text-blue-500"
              />
              Chords
            </label>
            
            {globalShowChords && (
              <div className="flex items-center gap-2 border-l pl-3 text-sm font-medium border-black/20">
                <span>Capo:</span>
                <button 
                  onClick={(e) => { e.currentTarget.blur(); setCapo(c => Math.max(-11, c - 1)); }}
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${btnHover}`}
                >-</button>
                <span className="w-5 text-center font-bold">{capo}</span>
                <button 
                  onClick={(e) => { e.currentTarget.blur(); setCapo(c => Math.min(11, c + 1)); }}
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${btnHover}`}
                >+</button>
              </div>
            )}
          </div>

          <div className={`flex gap-1 ${iconColor}`}>
            <button onClick={toggleFullscreen} className={`p-2 rounded-full transition-colors ${btnHover} bg-black/10`} title="Toggle Fullscreen">
              {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
            </button>
            <button onClick={handleExit} className={`p-2 rounded-full transition-colors ${btnHover} bg-black/10`} title="Close Presentation">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Visible Side Navigation Arrows (Fade out with mouse inactivity) */}
      <div className={`absolute inset-y-0 left-4 flex items-center z-20 transition-opacity duration-300 ${mouseActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <button 
          onClick={(e) => { e.stopPropagation(); prevSlide(); }}
          disabled={currentSlide === 0}
          className={`p-4 rounded-full backdrop-blur-md transition-all disabled:opacity-0 disabled:cursor-not-allowed ${uiBg} ${btnHover}`}
        >
          <ChevronLeft className="w-8 h-8 md:w-10 md:h-10" />
        </button>
      </div>

      <div className={`absolute inset-y-0 right-4 flex items-center z-20 transition-opacity duration-300 ${mouseActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <button 
          onClick={(e) => { e.stopPropagation(); nextSlide(); }}
          disabled={currentSlide === song.slides.length - 1}
          className={`p-4 rounded-full backdrop-blur-md transition-all disabled:opacity-0 disabled:cursor-not-allowed ${uiBg} ${btnHover}`}
        >
          <ChevronRight className="w-8 h-8 md:w-10 md:h-10" />
        </button>
      </div>

      {/* Invisible Large Click Targets for natural presenter feel */}
      <div className="absolute inset-0 flex z-10 pt-20 pb-10">
        <div className="w-1/3 h-full cursor-pointer" onClick={prevSlide} />
        <div className="w-2/3 h-full cursor-pointer" onClick={nextSlide} />
      </div>

      {/* Slide Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-24 select-none relative z-0 bg-white">
        {slide?.type === 'title' ? (
          <h1 
            className="font-bold text-center tracking-tight max-w-7xl text-black"
            style={{ 
              lineHeight: lineHeight,
              fontSize: `calc(clamp(3rem, 8vw, 7rem) * ${fontScale})`,
              color: '#000000',
              WebkitTextFillColor: '#000000'
            }}
          >
            {slide.text}
          </h1>
        ) : (
          <div 
            className="font-semibold text-center max-w-7xl w-full text-black"
            style={{
              fontSize: `calc(clamp(1.875rem, 5vw, 4.5rem) * ${fontScale})`,
              color: '#000000',
              WebkitTextFillColor: '#000000'
            }}
          >
            {slide?.text?.split('\n').map((line, idx) => (
              <div 
                key={idx} 
                className="flex justify-center w-full"
                style={{ marginBottom: `${lineHeight * 0.4}em` }}
              >
                {renderLyricLine(line)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-black/5 z-30">
        <div 
          className="h-full bg-blue-500 transition-all duration-300 ease-out"
          style={{ width: `${((currentSlide + 1) / song.slides.length) * 100}%` }}
        />
      </div>
    </div>
  );
};

const LanguageGroup = ({ group, searchActive, onSelect }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    if (searchActive) setIsExpanded(true);
  }, [searchActive]);

  return (
    <div id={`lang-${group.language}`} className="scroll-mt-36 mb-6">
      <button 
        className="flex items-center gap-2 w-full text-left py-3 border-b border-gray-200 mb-3 group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h2 
          className="text-xl font-bold text-black"
          style={{ color: '#000000', WebkitTextFillColor: '#000000' }}
        >
          {group.language}
        </h2>
        {isExpanded ? 
          <ChevronUp className="w-5 h-5 text-black group-hover:text-blue-600 transition-colors" /> : 
          <ChevronDown className="w-5 h-5 text-black group-hover:text-blue-600 transition-colors" />
        }
      </button>
      
      {isExpanded && (
        <ul className="flex flex-col border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
          {group.songs.map((song, index) => (
            <li 
              key={song.id}
              onClick={() => onSelect(song)}
              className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors flex items-center ${
                index !== group.songs.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <span 
                className="font-medium text-[15px] text-black"
                style={{ color: '#000000', WebkitTextFillColor: '#000000' }}
              >
                {song.title}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const LoginForm = ({ onLogin, onCancel }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username === 'ICOC' && password === 'ICOC@1234') {
      onLogin();
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Lock className="w-6 h-6 text-blue-500" /> Admin Access
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-medium">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-100 border border-transparent focus:border-blue-500 focus:bg-white outline-none transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-100 border border-transparent focus:border-blue-500 focus:bg-white outline-none transition-colors"
              required
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors mt-2"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

const AdminPanel = ({ songs, setSongs, onLogout }) => {
  const [editingSong, setEditingSong] = useState(null);

  const saveToStorage = (newSongs) => {
    setSongs(newSongs);
    localStorage.setItem('icoc_songs', JSON.stringify(newSongs));
  };

  const handleAddNew = () => {
    setEditingSong({
      id: Date.now().toString(),
      language: LANGUAGES[0],
      title: '',
      slides: [{ type: 'title', text: '' }]
    });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this song?')) {
      saveToStorage(songs.filter(s => s.id !== id));
    }
  };

  const handleSave = () => {
    if (!editingSong.title.trim()) {
      alert("Title is required!");
      return;
    }
    
    const exists = songs.some(s => s.id === editingSong.id);
    let newSongs;
    
    if (exists) {
      newSongs = songs.map(s => s.id === editingSong.id ? editingSong : s);
    } else {
      newSongs = [...songs, editingSong];
    }
    
    // Keep songs sorted by title within their language
    newSongs.sort((a, b) => a.title.localeCompare(b.title));
    
    saveToStorage(newSongs);
    setEditingSong(null);
  };

  const updateSlide = (index, field, value) => {
    const newSlides = [...editingSong.slides];
    newSlides[index] = { ...newSlides[index], [field]: value };
    setEditingSong({ ...editingSong, slides: newSlides });
  };

  const addSlide = () => {
    setEditingSong({
      ...editingSong,
      slides: [...editingSong.slides, { type: 'lyric', text: '' }]
    });
  };

  const removeSlide = (index) => {
    setEditingSong({
      ...editingSong,
      slides: editingSong.slides.filter((_, i) => i !== index)
    });
  };

  if (editingSong) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Edit2 className="w-6 h-6" /> {songs.some(s => s.id === editingSong.id) ? 'Edit Song' : 'Add New Song'}
          </h2>
          <div className="flex gap-2">
            <button onClick={() => setEditingSong(null)} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors">
              <Save className="w-4 h-4" /> Save Song
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Song Title</label>
              <input 
                type="text" 
                value={editingSong.title}
                onChange={(e) => setEditingSong({...editingSong, title: e.target.value})}
                className="w-full px-4 py-2 rounded-lg bg-gray-50 border border-gray-300 focus:border-blue-500 outline-none"
                placeholder="Enter song title..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Language Category</label>
              <select 
                value={editingSong.language}
                onChange={(e) => setEditingSong({...editingSong, language: e.target.value})}
                className="w-full px-4 py-2 rounded-lg bg-gray-50 border border-gray-300 focus:border-blue-500 outline-none"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-4">Slides Content</h3>
        <div className="space-y-4">
          {editingSong.slides.map((slide, index) => (
            <div key={index} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Slide {index + 1}</span>
                  <select 
                    value={slide.type}
                    onChange={(e) => updateSlide(index, 'type', e.target.value)}
                    className="px-3 py-1 text-sm rounded bg-gray-100 border-none outline-none"
                  >
                    <option value="title">Title Slide</option>
                    <option value="lyric">Lyric Slide</option>
                  </select>
                </div>
                <textarea 
                  value={slide.text}
                  onChange={(e) => updateSlide(index, 'text', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 focus:border-blue-500 outline-none min-h-[120px] resize-y"
                  placeholder={slide.type === 'title' ? "Enter Song Title..." : "Enter lyrics here...\nUse enter for new lines.\nTo add chords, type them in brackets before the word: [G]Amazing [C]grace"}
                />
              </div>
              <div className="flex flex-col justify-center border-l border-gray-200 pl-4">
                <button 
                  onClick={() => removeSlide(index)}
                  disabled={editingSong.slides.length === 1}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30"
                  title="Remove Slide"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <button 
          onClick={addSlide}
          className="w-full mt-4 py-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-600 hover:text-blue-600 flex items-center justify-center gap-2 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" /> Add New Slide
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Admin Dashboard</h2>
        <div className="flex gap-3">
          <button onClick={handleAddNew} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-sm">
            <Plus className="w-4 h-4" /> Add Song
          </button>
          <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 hover:bg-gray-300 rounded-lg transition-colors font-medium">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>

      <div className="grid gap-6">
        {LANGUAGES.map(lang => {
          const langSongs = songs.filter(s => s.language === lang);
          if (langSongs.length === 0) return null;

          return (
            <div key={lang} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <h3 className="font-bold text-gray-800">{lang} Songs ({langSongs.length})</h3>
              </div>
              <ul className="divide-y divide-gray-100">
                {langSongs.map(song => (
                  <li key={song.id} className="p-4 sm:px-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-900">{song.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setEditingSong(song)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Song"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(song.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Song"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function App() {
  // Load songs from localStorage or fallback to initial
  const [songs, setSongs] = useState(() => {
    const saved = localStorage.getItem('icoc_songs');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error('Failed to parse songs', e); }
    }
    return INITIAL_SONGS;
  });

  const [activeView, setActiveView] = useState('list'); // 'list' | 'viewer' | 'login' | 'admin'
  const [selectedSong, setSelectedSong] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [globalShowChords, setGlobalShowChords] = useState(true);

  const filteredGroups = useMemo(() => {
    if (!searchQuery) {
      return LANGUAGES.map(lang => ({
        language: lang,
        songs: songs.filter(s => s.language === lang)
      })).filter(g => g.songs.length > 0);
    }

    const query = searchQuery.toLowerCase();
    return LANGUAGES.map(lang => {
      const filtered = songs.filter(s => 
        s.language === lang && s.title.toLowerCase().includes(query)
      );
      return { language: lang, songs: filtered };
    }).filter(g => g.songs.length > 0);
  }, [searchQuery, songs]);

  const scrollToLanguage = (lang) => {
    const element = document.getElementById(`lang-${lang}`);
    if (element) {
      const headerOffset = 140; 
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };

  return (
    <div>
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans transition-colors duration-200">
        
        {/* User Dashboard / List View */}
        {activeView === 'list' && (
          <>
            <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
              <header className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="text-2xl font-bold tracking-tight text-blue-600 flex items-center gap-2">
                  <span>ICC Slides</span>
                </div>
                
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative flex-grow sm:flex-grow-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Search songs..." 
                      className="w-full pl-9 pr-4 py-2 rounded-full bg-gray-100 border-transparent focus:border-blue-500 focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:w-64 transition-all"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex items-center gap-1 border-l border-gray-300 pl-3 ml-1">
                    <button 
                      onClick={() => isAdminAuth ? setActiveView('admin') : setActiveView('login')}
                      className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex-shrink-0"
                      title="Admin Panel"
                    >
                      <Lock className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              </header>

              <div className="max-w-6xl mx-auto px-4 py-3 flex overflow-x-auto hide-scrollbar gap-6 text-sm font-medium border-t border-gray-100">
                {LANGUAGES.map(lang => (
                  <button 
                    key={lang}
                    onClick={() => scrollToLanguage(lang)}
                    className="whitespace-nowrap text-black font-bold hover:text-blue-600 transition-colors"
                    style={{ color: '#000000', WebkitTextFillColor: '#000000' }}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 min-h-[80vh]">
              {filteredGroups.length === 0 ? (
                <div className="text-center py-20">
                  <Music className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No songs found</h3>
                  <p className="text-gray-500 mt-1">Try adjusting your search query.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredGroups.map(group => (
                    <LanguageGroup 
                      key={group.language} 
                      group={group} 
                      searchActive={!!searchQuery}
                      onSelect={(song) => {
                        setSelectedSong(song);
                        setActiveView('viewer');
                      }} 
                    />
                  ))}
                </div>
              )}
            </main>
          </>
        )}

        {/* Presenter / Slide Viewer Mode */}
        {activeView === 'viewer' && selectedSong && (
          <SongViewer 
            song={selectedSong} 
            onExit={() => {
              setActiveView('list');
              setSelectedSong(null);
            }} 
            globalShowChords={globalShowChords}
            setGlobalShowChords={setGlobalShowChords}
          />
        )}

        {/* Admin Login View */}
        {activeView === 'login' && (
          <LoginForm 
            onLogin={() => {
              setIsAdminAuth(true);
              setActiveView('admin');
            }}
            onCancel={() => setActiveView('list')}
          />
        )}

        {/* Admin Panel View */}
        {activeView === 'admin' && (
          <>
             {/* Simple Admin Header */}
             <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm p-4 flex justify-between items-center">
                <button onClick={() => setActiveView('list')} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
                  <ChevronLeft className="w-5 h-5" /> Back to Songs
                </button>
                <div className="text-gray-500 text-sm font-semibold uppercase tracking-widest">Administrator</div>
             </div>
             <AdminPanel 
               songs={songs} 
               setSongs={setSongs} 
               onLogout={() => {
                 setIsAdminAuth(false);
                 setActiveView('list');
               }} 
             />
          </>
        )}

      </div>
    </div>
  );
}