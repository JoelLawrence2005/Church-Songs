import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, Sun, Moon, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, 
  Maximize, Minimize, Play, X, Music, Lock, Plus, Edit2, Trash2, Save, LogOut 
} from 'lucide-react';

const LANGUAGES = ['English', 'Sinhala', 'Tamil'];

const CHROMA_SCALE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_TO_SHARP = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };

const transposeChord = (chord, steps) => {
  if (!chord || steps === 0) return chord;
  // Matches root notes like C, C#, Bb
  return chord.replace(/[CDEFGAB][#b]?/g, match => {
    const note = FLAT_TO_SHARP[match] || match;
    const index = CHROMA_SCALE.indexOf(note);
    if (index === -1) return match;
    let newIndex = (index + steps) % 12;
    if (newIndex < 0) newIndex += 12; 
    return CHROMA_SCALE[newIndex];
  });
};

const INITIAL_SONGS = [
  // English
  { id: 'e1', language: 'English', title: 'Above All Powers', slides: [{ type: 'title', text: 'Above All Powers' }, { type: 'lyric', text: '[G]Above all [C]powers\n[D]Above all [G]kings\n[G]Above all [C]nature\nAnd [D]all created [G]things' }, { type: 'lyric', text: '[G]Above all [C]wisdom\nAnd [D]all the ways of [G]man\nYou were [Em]here\nBefore the world [C]began [D]' }] },
  { id: 'e2', language: 'English', title: 'Amazing Grace', slides: [{ type: 'title', text: 'Amazing Grace' }, { type: 'lyric', text: '[G]Amazing [G7]grace! How [C]sweet the [G]sound\nThat [G]saved a wretch like [D]me!' }, { type: 'lyric', text: 'I [G]once was [G7]lost, but [C]now am [G]found;\nWas [Em]blind, but [D]now I [G]see.' }] },
  
  // Sinhala
  { id: 's1', language: 'Sinhala', title: 'Yesu Obe Namayata', slides: [{ type: 'title', text: 'Yesu Obe Namayata' }, { type: 'lyric', text: 'Yesu obe namayata\nPrashansa wewa' }, { type: 'lyric', text: 'Mulu hadawathinma\nOba namadimi' }] },
  { id: 's2', language: 'Sinhala', title: 'Mage Galawumkaraya', slides: [{ type: 'title', text: 'Mage Galawumkaraya' }, { type: 'lyric', text: 'Mage galawumkaraya\nJiwamanawa atha' }] },
  
  // Tamil
  { id: 't1', language: 'Tamil', title: 'En Uyirana Yesu', slides: [{ type: 'title', text: 'En Uyirana Yesu' }, { type: 'lyric', text: 'En uyirana Yesu\nEn aaruyire' }, { type: 'lyric', text: 'Neer illamal\nNaan vazhavillai' }] },
  { id: 't2', language: 'Tamil', title: 'Ummai Nambi Vandhaen', slides: [{ type: 'title', text: 'Ummai Nambi Vandhaen' }, { type: 'lyric', text: 'Ummai nambi vandhaen\nNaan vetkapadavillai' }] },
];
const SongViewer = ({ song, onExit, globalShowChords, setGlobalShowChords }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mouseActive, setMouseActive] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [capo, setCapo] = useState(0);
  const viewerRef = useRef(null);

  const nextSlide = () => setCurrentSlide(prev => Math.min(prev + 1, song.slides.length - 1));
  const prevSlide = () => setCurrentSlide(prev => Math.max(prev - 1, 0));

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && viewerRef.current) {
      viewerRef.current.requestFullscreen().catch(err => console.log(err));
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

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
        if (isFullscreen) {
          document.exitFullscreen().catch(() => {});
        } else {
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
    // If chords are off or there are no chords in the line, render as plain text
    if (!globalShowChords || !line.includes('[')) {
      return <div className="min-h-[1.5em] leading-relaxed">{line.replace(/\[.*?\]/g, '')}</div>;
    }

    // Split text by chord brackets [Chord]
    const parts = line.split(/\[(.*?)\]/);
    const segments = [];

    for (let i = 0; i < parts.length; i += 2) {
      const lyric = parts[i];
      const rawChord = i > 0 ? parts[i - 1] : null;
      const transposedChord = rawChord ? transposeChord(rawChord, capo) : null;

      if (!rawChord && !lyric) continue;

      segments.push(
        <span key={i} className="inline-flex flex-col justify-end whitespace-pre text-left">
          {/* Invisible h-[1em] ensures consistent vertical spacing even if a specific segment has no chord */}
          <span className="text-yellow-400 font-bold text-[0.45em] leading-none mb-2 h-[1em] drop-shadow-md">
            {transposedChord || ''}
          </span>
          <span className="leading-tight">{lyric || ''}</span>
        </span>
      );
    }
    return <div className="flex flex-wrap justify-center items-end">{segments}</div>;
  };

  return (
    <div 
      ref={viewerRef}
      className={`fixed inset-0 bg-white text-gray-900 z-50 flex flex-col font-sans transition-all duration-300 ${mouseActive ? 'cursor-default' : 'cursor-none'}`}
    >
      {/* Top Header Controls */}
      <div className={`absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20 bg-gradient-to-b from-white/90 to-transparent transition-opacity duration-300 ${mouseActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="text-gray-900/90 font-medium flex items-center gap-2 drop-shadow-sm">
          <button onClick={onExit} className="p-2 hover:bg-gray-100 rounded-full transition-colors mr-2">
             <ChevronLeft className="w-6 h-6 text-gray-900" />
          </button>
          <span className="text-lg">{song.title}</span>
          <span className="text-gray-500 mx-2">|</span>
          <span className="text-sm">Slide {currentSlide + 1} of {song.slides.length}</span>
        </div>
        
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Chord Controls */}
          <div 
            className="flex items-center gap-4 bg-white/75 px-4 py-1.5 rounded-full backdrop-blur-sm border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <label className="flex items-center gap-2 cursor-pointer text-gray-900 text-sm font-medium">
              <input 
                type="checkbox" 
                checked={globalShowChords} 
                onChange={(e) => setGlobalShowChords(e.target.checked)}
                className="w-4 h-4 rounded bg-white/20 border-transparent text-blue-500"
              />
              Chords
            </label>
            
            {globalShowChords && (
              <div className="flex items-center gap-2 border-l border-gray-200 pl-4 text-gray-900 text-sm font-medium">
                <span>Capo:</span>
                <button 
                  onClick={(e) => { e.currentTarget.blur(); setCapo(c => Math.max(-11, c - 1)); }}
                  className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >-</button>
                <span className="w-6 text-center font-bold text-gray-900">{capo}</span>
                <button 
                  onClick={(e) => { e.currentTarget.blur(); setCapo(c => Math.min(11, c + 1)); }}
                  className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >+</button>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={toggleFullscreen} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-900" title="Toggle Fullscreen">
              {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
            </button>
            <button onClick={onExit} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-900" title="Close Presentation">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Visible Side Navigation Arrows (Fade out with mouse inactivity) */}
      <div className={`absolute inset-y-0 left-4 flex items-center z-20 transition-opacity duration-300 ${mouseActive ? 'opacity-100' : 'opacity-0'}`}>
        <button 
          onClick={(e) => { e.stopPropagation(); prevSlide(); }}
          disabled={currentSlide === 0}
          className="p-4 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-900 backdrop-blur-sm transition-all disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-10 h-10" />
        </button>
      </div>

      <div className={`absolute inset-y-0 right-4 flex items-center z-20 transition-opacity duration-300 ${mouseActive ? 'opacity-100' : 'opacity-0'}`}>
        <button 
          onClick={(e) => { e.stopPropagation(); nextSlide(); }}
          disabled={currentSlide === song.slides.length - 1}
          className="p-4 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-900 backdrop-blur-sm transition-all disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-10 h-10" />
        </button>
      </div>

      {/* Invisible Large Click Targets for natural presenter feel */}
      <div className="absolute inset-0 flex z-10 pt-20 pb-10">
        <div className="w-1/3 h-full cursor-pointer" onClick={prevSlide} />
        <div className="w-2/3 h-full cursor-pointer" onClick={nextSlide} />
      </div>

      {/* Slide Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-24 select-none relative z-0">
        {slide?.type === 'title' ? (
          <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-[7rem] font-bold text-center text-gray-900 tracking-tight leading-tight drop-shadow-2xl max-w-7xl mx-auto">
            {slide.text}
          </h1>
        ) : (
          <div className="text-3xl sm:text-5xl md:text-6xl lg:text-[4.5rem] font-semibold text-center text-gray-900 drop-shadow-xl max-w-7xl w-full mx-auto">
            {slide?.text?.split('\n').map((line, idx) => (
              <div key={idx} className="flex justify-center w-full mb-4 sm:mb-6 lg:mb-8 last:mb-0">
                {renderLyricLine(line)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-white/10 z-20">
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
        className="flex items-center gap-2 w-full text-left py-3 border-b dark:border-gray-800 mb-3 group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{group.language}</h2>
        {isExpanded ? 
          <ChevronUp className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" /> : 
          <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
        }
      </button>
      
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {group.songs.map(song => (
            <div 
              key={song.id}
              onClick={() => onSelect(song)}
              className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-gray-800 dark:hover:border-blue-900 cursor-pointer transition-all duration-200 flex items-center justify-between group shadow-sm hover:shadow"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <Music className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                <span className="font-medium text-gray-700 dark:text-gray-200 group-hover:text-blue-700 dark:group-hover:text-blue-400 truncate">
                  {song.title}
                </span>
              </div>
              <Play className="w-4 h-4 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 group-hover:text-blue-500 transition-all flex-shrink-0" />
            </div>
          ))}
        </div>
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100 dark:border-gray-800">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Lock className="w-6 h-6 text-blue-500" /> Admin Access
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4 text-sm font-medium">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-gray-950 outline-none transition-colors dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-gray-950 outline-none transition-colors dark:text-white"
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
      <div className="w-full p-4 sm:p-6 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
            <Edit2 className="w-6 h-6" /> {songs.some(s => s.id === editingSong.id) ? 'Edit Song' : 'Add New Song'}
          </h2>
          <div className="flex gap-2">
            <button onClick={() => setEditingSong(null)} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors">
              <Save className="w-4 h-4" /> Save Song
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Song Title</label>
              <input 
                type="text" 
                value={editingSong.title}
                onChange={(e) => setEditingSong({...editingSong, title: e.target.value})}
                className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:border-blue-500 outline-none dark:text-white"
                placeholder="Enter song title..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Language Category</label>
              <select 
                value={editingSong.language}
                onChange={(e) => setEditingSong({...editingSong, language: e.target.value})}
                className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:border-blue-500 outline-none dark:text-white"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <h3 className="text-xl font-bold dark:text-white mb-4">Slides Content</h3>
        <div className="space-y-4">
          {editingSong.slides.map((slide, index) => (
            <div key={index} className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Slide {index + 1}</span>
                  <select 
                    value={slide.type}
                    onChange={(e) => updateSlide(index, 'type', e.target.value)}
                    className="px-3 py-1 text-sm rounded bg-gray-100 dark:bg-gray-800 border-none outline-none dark:text-white"
                  >
                    <option value="title">Title Slide</option>
                    <option value="lyric">Lyric Slide</option>
                  </select>
                </div>
                <textarea 
                  value={slide.text}
                  onChange={(e) => updateSlide(index, 'text', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:border-blue-500 outline-none dark:text-white min-h-[120px] resize-y"
                  placeholder={slide.type === 'title' ? "Enter Song Title..." : "Enter lyrics here...\nUse enter for new lines.\nTo add chords, type them in brackets before the word: [G]Amazing [C]grace"}
                />
              </div>
              <div className="flex flex-col justify-center border-l border-gray-200 dark:border-gray-800 pl-4">
                <button 
                  onClick={() => removeSlide(index)}
                  disabled={editingSong.slides.length === 1}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-30"
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
          className="w-full mt-4 py-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-600 dark:text-gray-400 hover:text-blue-600 flex items-center justify-center gap-2 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" /> Add New Slide
        </button>
      </div>
    );
  }

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h2 className="text-3xl font-bold dark:text-white">Admin Dashboard</h2>
        <div className="flex gap-3">
          <button onClick={handleAddNew} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-sm">
            <Plus className="w-4 h-4" /> Add Song
          </button>
          <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>

      <div className="grid gap-6">
        {LANGUAGES.map(lang => {
          const langSongs = songs.filter(s => s.language === lang);
          if (langSongs.length === 0) return null;

          return (
            <div key={lang} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
              <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-3 border-b border-gray-200 dark:border-gray-800">
                <h3 className="font-bold text-gray-800 dark:text-gray-200">{lang} Songs ({langSongs.length})</h3>
              </div>
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {langSongs.map(song => (
                  <li key={song.id} className="p-4 sm:px-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Music className="w-5 h-5 text-gray-400" />
                      <span className="font-medium dark:text-white">{song.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setEditingSong(song)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="Edit Song"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(song.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
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
  const [darkMode, setDarkMode] = useState(false);
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
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-200">
        
        {/* User Dashboard / List View */}
        {activeView === 'list' && (
          <>
            <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm">
              <header className="w-full px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400 flex items-center gap-2">
                  <span>ICC Slides</span>
                </div>
                
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative flex-grow sm:flex-grow-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Search songs..." 
                      className="w-full pl-9 pr-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:w-64 transition-all"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex items-center gap-1 border-l border-gray-300 dark:border-gray-700 pl-3 ml-1">
                    <button 
                      onClick={() => setDarkMode(!darkMode)} 
                      className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
                      title="Toggle Dark Mode"
                    >
                      {darkMode ? <Sun className="w-4 h-4 text-gray-400" /> : <Moon className="w-4 h-4 text-gray-600" />}
                    </button>
                    
                    <button 
                      onClick={() => isAdminAuth ? setActiveView('admin') : setActiveView('login')}
                      className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
                      title="Admin Panel"
                    >
                      <Lock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                </div>
              </header>

              <div className="w-full px-4 py-3 flex overflow-x-auto hide-scrollbar gap-6 text-sm font-medium border-t border-gray-100 dark:border-gray-800/50">
                {LANGUAGES.map(lang => (
                  <button 
                    key={lang}
                    onClick={() => scrollToLanguage(lang)}
                    className="whitespace-nowrap text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            <main className="w-full p-4 sm:p-6 lg:p-8 min-h-[80vh]">
              {filteredGroups.length === 0 ? (
                <div className="text-center py-20">
                  <Music className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-200">No songs found</h3>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">Try adjusting your search query.</p>
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
             <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm p-4 flex justify-between items-center">
                <button onClick={() => setActiveView('list')} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium">
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