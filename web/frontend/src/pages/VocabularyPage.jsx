import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BookA, BookOpen, Search, Star, Volume2, Copy, Check, RefreshCw, CheckCircle2, Bookmark, WifiOff, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import { idbService } from '../services/db/indexedDbService.js';
import { contentSyncService } from '../services/contentSyncService.js';
import { voiceService } from '../services/voiceService.js';

export default function VocabularyPage() {
  const [vocabulary, setVocabulary] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [learnedFilter, setLearnedFilter] = useState('All'); // 'All' | 'Learned' | 'Not Learned'
  const [isLoading, setIsLoading] = useState(true);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupMessage, setLookupMessage] = useState('');
  const [browseAllMode, setBrowseAllMode] = useState(false);
  const [syncState, setSyncState] = useState(() => contentSyncService.getState());
  const [copiedId, setCopiedId] = useState(null);
  const [activeVoiceId, setActiveVoiceId] = useState(null);
  const [visibleCount, setVisibleCount] = useState(30);

  // Quick lookup dictionary suggestions
  const SUGGESTED_LOOKUPS = [
    'remember',
    'magnify',
    'schedule',
    'improve',
    'understand',
    'important',
    'available',
    'difficult',
    'comfortable',
    'necessary',
    'curious',
    'beautiful',
    'help',
    'time',
    'water',
    'home'
  ];

  // Load content from IndexedDB
  const loadData = useCallback(async () => {
    try {
      // Load categories dynamically from IndexedDB
      let dbCategories = await idbService.getAllCategories('vocabulary');
      let catNames = ['All', ...dbCategories.map(c => c.name)];
      setCategories(catNames);

      // Load vocabulary dynamically with filters
      let items = await idbService.getAllVocabulary({
        category: selectedCategory,
        search: searchQuery,
        onlyFavorites,
        learnedFilter
      });

      // Direct fallback hydration if IndexedDB is completely empty
      if (items.length === 0 && selectedCategory === 'All' && !searchQuery && !onlyFavorites && learnedFilter === 'All') {
        try {
          const apiRes = await fetch('http://localhost:5000/api/v1/vocabulary?limit=200');
          if (apiRes.ok) {
            const apiJson = await apiRes.json();
            if (apiJson.success && Array.isArray(apiJson.data) && apiJson.data.length > 0) {
              await idbService.putVocabularyList(apiJson.data);
              const catRes = await fetch('http://localhost:5000/api/v1/categories');
              if (catRes.ok) {
                const catJson = await catRes.json();
                if (catJson.success && Array.isArray(catJson.data)) {
                  await idbService.putCategoriesList(catJson.data);
                  dbCategories = await idbService.getAllCategories('vocabulary');
                  setCategories(['All', ...dbCategories.map(c => c.name)]);
                }
              }
              items = await idbService.getAllVocabulary({
                category: selectedCategory,
                search: searchQuery,
                onlyFavorites,
                learnedFilter
              });
            }
          }
        } catch (fetchErr) {
          console.warn('[Vocabulary] Direct API fallback unavailable (offline):', fetchErr.message);
        }
      }

      setVocabulary(items);
    } catch (err) {
      console.error('[Vocabulary] Failed to load from IndexedDB:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, searchQuery, onlyFavorites, learnedFilter]);

  // Initial load and sync listener setup
  useEffect(() => {
    loadData();

    const unsubscribeSync = contentSyncService.subscribe((state) => {
      setSyncState(state);
    });

    const handleSyncedEvent = () => {
      loadData();
    };

    window.addEventListener('ha_content_synced', handleSyncedEvent);

    return () => {
      unsubscribeSync();
      window.removeEventListener('ha_content_synced', handleSyncedEvent);
    };
  }, [loadData]);

  // Handle word lookup process
  const performLookup = async (targetWord) => {
    const q = (targetWord || searchQuery).trim();
    if (!q) return;

    setIsLookingUp(true);
    setLookupMessage(`Consulting offline dictionary for "${q}"...`);

    try {
      // 1. First check local IndexedDB
      const localMatches = await idbService.getAllVocabulary({ search: q });
      const exactLocal = localMatches.find(v =>
        v.english.toLowerCase() === q.toLowerCase() ||
        (v.hindi && v.hindi.includes(q)) ||
        (v.telugu && v.telugu.includes(q))
      );

      if (exactLocal) {
        setLookupMessage('');
        setIsLookingUp(false);
        setSearchQuery(exactLocal.english);
        return;
      }

      // 2. Query backend dictionary lookup API if online
      if (syncState.isOnline) {
        setLookupMessage(`Checking dictionary database for "${q}"...`);
        const res = await fetch(`http://localhost:5000/api/v1/vocabulary/lookup?word=${encodeURIComponent(q)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            // Store directly into local IndexedDB so it's permanently available offline
            await idbService.putVocabularyList([json.data]);
            await loadData();
            setSearchQuery(json.data.english);
            setLookupMessage('');
            setIsLookingUp(false);
            return;
          }
        }
      }
    } catch (e) {
      console.warn('[Lookup] Processing error:', e.message);
    } finally {
      setIsLookingUp(false);
      setLookupMessage('');
    }
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      performLookup(searchQuery.trim());
    }
  };

  const handleQuickLookup = (word) => {
    setSearchQuery(word);
    setSelectedCategory('All');
    performLookup(word);
  };

  // Toggle user-specific favorite
  const handleToggleFavorite = async (id) => {
    const nextFav = await idbService.toggleVocabFavorite(id);
    setVocabulary(prev => prev.map(v => v.id === id ? { ...v, isFavorite: nextFav } : v));
  };

  // Toggle user-specific learned status
  const handleToggleLearned = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'learned' ? 'new' : 'learned';
    await idbService.setVocabLearnedStatus(id, nextStatus);
    setVocabulary(prev => prev.map(v => v.id === id ? { ...v, learnedStatus: nextStatus } : v));
  };

  // Text-to-Speech pronunciation playback
  const handlePronounce = (text, lang, id) => {
    if (activeVoiceId === id) {
      voiceService.stopSpeaking();
      setActiveVoiceId(null);
      return;
    }

    setActiveVoiceId(id);
    voiceService.speak({
      text,
      lang: lang || 'hi',
      onEnd: () => setActiveVoiceId(null),
      onError: () => setActiveVoiceId(null)
    });
  };

  const handleCopy = (text, idKey) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedId(idKey);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleManualSync = async () => {
    await contentSyncService.syncWithBackend(true);
    await loadData();
  };

  const hasActiveSearch = Boolean(searchQuery.trim());
  const isFilteringCategory = selectedCategory !== 'All';
  const isFilteringStatus = learnedFilter !== 'All';
  const isShowingFilteredCards = hasActiveSearch || isFilteringCategory || isFilteringStatus || onlyFavorites || browseAllMode;

  const visibleItems = vocabulary.slice(0, visibleCount);

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1050px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen size={28} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '1.6rem', margin: 0, fontWeight: 800 }}>Offline Vocabulary Book</h2>
            
            {/* Sync & Offline Status Indicator */}
            {!syncState.isOnline ? (
              <span className="badge-pill" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem' }}>
                <WifiOff size={11} /> Offline Book • Stored Locally
              </span>
            ) : (
              <span className="badge-pill badge-on-device" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem' }}>
                <CheckCircle2 size={11} color="#10b981" /> Storage Synced • Available Offline
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '6px 0 0 0' }}>
            Interactive offline dictionary & language book for English, Hindi, and Telugu. Look up any word to process and view its meaning.
          </p>
        </div>

        {/* Sync Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleManualSync}
            disabled={syncState.isSyncing || !syncState.isOnline}
            className="btn-secondary"
            style={{ padding: '6px 14px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            title="Synchronize offline storage with backend database"
          >
            <RefreshCw size={13} className={syncState.isSyncing ? 'pulsing-indicator' : ''} />
            <span>{syncState.isSyncing ? 'Syncing...' : 'Sync Storage'}</span>
          </button>
        </div>
      </div>

      {/* Dictionary Search / Lookup Bar */}
      <div className="glass-card" style={{ padding: '20px', marginBottom: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
            <Search size={18} color="var(--accent-primary)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Look up any word in English, Hindi, or Telugu (e.g. remember, magnify)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '42px', paddingRight: searchQuery ? '36px' : '14px', height: '46px', fontSize: '0.98rem' }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setBrowseAllMode(false); }}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem' }}
                title="Clear lookup"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isLookingUp || !searchQuery.trim()}
            className="btn-primary"
            style={{ height: '46px', padding: '0 22px', fontSize: '0.92rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            {isLookingUp ? <Loader2 size={16} className="pulsing-indicator" /> : <Search size={16} />}
            <span>Look Up Word</span>
          </button>
        </form>

        {/* Filter Controls Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', paddingTop: '4px', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginRight: '4px' }}>Categories:</span>
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  if (cat !== 'All') setBrowseAllMode(true);
                }}
                style={{
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-full)',
                  border: selectedCategory === cat ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  background: selectedCategory === cat ? 'var(--accent-gradient)' : 'var(--bg-tertiary)',
                  color: selectedCategory === cat ? '#fff' : 'var(--text-secondary)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all var(--transition-fast)'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <input
                type="checkbox"
                checked={onlyFavorites}
                onChange={(e) => {
                  setOnlyFavorites(e.target.checked);
                  if (e.target.checked) setBrowseAllMode(true);
                }}
              />
              <span>Favorites Only</span>
            </label>

            <select
              value={learnedFilter}
              onChange={(e) => {
                setLearnedFilter(e.target.value);
                if (e.target.value !== 'All') setBrowseAllMode(true);
              }}
              style={{
                padding: '5px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              <option value="All">All Statuses</option>
              <option value="Not Learned">Not Learned</option>
              <option value="Learned">Learned</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dictionary Lookup Process State */}
      {isLookingUp && (
        <div
          className="glass-card animate-fade-in"
          style={{
            padding: '24px',
            marginBottom: '20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            background: 'rgba(59, 130, 246, 0.05)',
            border: '1.5px dashed var(--accent-primary)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Loader2 size={24} color="var(--accent-primary)" className="pulsing-indicator" />
            <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {lookupMessage || `Consulting Offline Dictionary for "${searchQuery}"...`}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Processing meaning, Devanagari translation, Telugu script, pronunciation, and examples.
          </p>
        </div>
      )}

      {/* Main Body: Offline Book Cover vs Searched Word Cards */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <Loader2 size={32} className="pulsing-indicator" style={{ margin: '0 auto 12px auto' }} />
          <div>Opening offline dictionary book...</div>
        </div>
      ) : !isShowingFilteredCards ? (
        /* OFFLINE DICTIONARY BOOK COVER / WELCOME STATE */
        <div className="glass-card animate-fade-in" style={{ padding: '36px 28px', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', boxShadow: '0 8px 24px rgba(59, 130, 246, 0.25)' }}>
            <BookOpen size={32} color="#fff" />
          </div>

          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
            Offline Dictionary & Vocabulary Book
          </h3>
          <p style={{ maxWidth: '600px', margin: '0 auto 24px auto', fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Type any word into the search bar above to look up its meaning, translations, and examples.
            Looked-up words are automatically saved to your on-device storage so they work anytime, even offline.
          </p>

          {/* Quick Lookup Suggestions */}
          <div style={{ maxWidth: '750px', margin: '0 auto', textAlign: 'left', background: 'var(--bg-tertiary)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Sparkles size={16} color="var(--accent-primary)" />
              <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Popular Words to Look Up in Offline Dictionary:
              </span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {SUGGESTED_LOOKUPS.map(word => (
                <button
                  key={word}
                  type="button"
                  onClick={() => handleQuickLookup(word)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all var(--transition-fast)'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.color = 'var(--accent-primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                >
                  <span>{word}</span>
                  <ArrowRight size={12} style={{ opacity: 0.6 }} />
                </button>
              ))}
            </div>
          </div>

          {/* Browse all button */}
          <div style={{ marginTop: '28px' }}>
            <button
              type="button"
              onClick={() => setBrowseAllMode(true)}
              className="btn-secondary"
              style={{ padding: '8px 22px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <BookA size={15} />
              <span>Browse All {vocabulary.length} Words in Offline Storage</span>
            </button>
          </div>
        </div>
      ) : visibleItems.length > 0 ? (
        /* DICTIONARY RESULTS / WORD CARDS GRID */
        <div>
          {hasActiveSearch && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                Showing dictionary matches for <strong>"{searchQuery}"</strong> ({visibleItems.length} found)
              </div>
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setBrowseAllMode(false); }}
                className="btn-secondary"
                style={{ padding: '4px 12px', fontSize: '0.78rem' }}
              >
                Back to Book Cover
              </button>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {visibleItems.map(item => {
              const isLearned = item.learnedStatus === 'learned';
              return (
                <div
                  key={item.id}
                  className="glass-card"
                  style={{
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    border: isLearned ? '1.5px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-subtle)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div>
                    {/* Header Badges & Actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span className="badge-pill" style={{ fontSize: '0.72rem', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                          {item.category || 'Conversational'}
                        </span>
                        {isLearned && (
                          <span className="badge-pill" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontSize: '0.7rem' }}>
                            ✓ Learned
                          </span>
                        )}
                        <span className="badge-pill" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-primary)', fontSize: '0.68rem' }}>
                          Offline Stored
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <button
                          onClick={() => handleToggleLearned(item.id, item.learnedStatus)}
                          className="btn-secondary"
                          style={{
                            padding: '3px 8px',
                            fontSize: '0.72rem',
                            background: isLearned ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-tertiary)',
                            color: isLearned ? '#10b981' : 'var(--text-secondary)'
                          }}
                          title={isLearned ? 'Mark as Not Learned' : 'Mark as Learned'}
                        >
                          {isLearned ? '✓ Learned' : 'Mark Learned'}
                        </button>

                        <button
                          onClick={() => handleToggleFavorite(item.id)}
                          className="btn-icon"
                          style={{ padding: '4px' }}
                          title={item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          <Star size={16} fill={item.isFavorite ? '#f59e0b' : 'none'} color={item.isFavorite ? '#f59e0b' : 'var(--text-muted)'} />
                        </button>
                      </div>
                    </div>

                    {/* English Headword */}
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {item.english}
                      </div>
                      {item.pronunciation && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            /{item.pronunciation}/
                          </span>
                          <button
                            onClick={() => handlePronounce(item.english, 'en', `en-${item.id}`)}
                            className="btn-icon"
                            style={{ padding: '2px' }}
                            title="Listen to English pronunciation"
                          >
                            <Volume2 size={13} color={activeVoiceId === `en-${item.id}` ? 'var(--accent-primary)' : 'var(--text-muted)'} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Hindi Translation & Transliteration */}
                    <div style={{ background: 'var(--bg-tertiary)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <div>
                          <div style={{ fontSize: '1.18rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                            {item.hindi}
                          </div>
                          {item.transliteration && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                              ({item.transliteration})
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handlePronounce(item.hindi, 'hi', `hi-${item.id}`)}
                          className="btn-icon"
                          style={{ padding: '4px' }}
                          title="Listen to Hindi pronunciation"
                        >
                          <Volume2 size={15} color={activeVoiceId === `hi-${item.id}` ? 'var(--accent-primary)' : 'var(--text-muted)'} />
                        </button>
                      </div>
                    </div>

                    {/* Telugu Translation */}
                    {item.telugu && (
                      <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <div>
                          <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700, textTransform: 'uppercase' }}>Telugu</div>
                          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '1px' }}>
                            {item.telugu}
                          </div>
                        </div>
                        <button
                          onClick={() => handlePronounce(item.telugu, 'te', `te-${item.id}`)}
                          className="btn-icon"
                          style={{ padding: '4px' }}
                          title="Listen to Telugu pronunciation"
                        >
                          <Volume2 size={15} color={activeVoiceId === `te-${item.id}` ? '#10b981' : 'var(--text-muted)'} />
                        </button>
                      </div>
                    )}

                    {/* Definition */}
                    {item.definition && (
                      <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '10px', lineHeight: 1.45 }}>
                        <strong>Meaning:</strong> {item.definition}
                      </div>
                    )}

                    {/* Example Sentences */}
                    {(item.exampleEnglish || item.exampleHindi) && (
                      <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', marginBottom: '8px', lineHeight: 1.5, border: '1px solid var(--border-subtle)' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase' }}>Conversation Example</div>
                        {item.exampleEnglish && <div><strong>EN:</strong> "{item.exampleEnglish}"</div>}
                        {item.exampleHindi && <div style={{ color: 'var(--text-primary)', marginTop: '2px' }}><strong>HI:</strong> "{item.exampleHindi}"</div>}
                        {item.exampleTelugu && <div style={{ color: '#10b981', marginTop: '2px' }}><strong>TE:</strong> "{item.exampleTelugu}"</div>}
                      </div>
                    )}

                    {/* Usage Note */}
                    {(item.note || item.usage_note) && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '4px' }}>
                        💡 {item.note || item.usage_note}
                      </div>
                    )}
                  </div>

                  {/* Footer Copy Actions */}
                  <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                    <button
                      onClick={() => handleCopy(item.hindi, `hi-${item.id}`)}
                      className="btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      {copiedId === `hi-${item.id}` ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                      <span>Copy Hindi</span>
                    </button>
                    <button
                      onClick={() => handleCopy(item.english, `en-${item.id}`)}
                      className="btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      {copiedId === `en-${item.id}` ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                      <span>Copy English</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* NO RESULTS STATE WITH DIRECT LOOKUP PROMPT */
        <div className="glass-card animate-fade-in" style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
          <BookA size={44} style={{ opacity: 0.35, marginBottom: '14px' }} />
          <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            No saved entries matched "{searchQuery}"
          </p>
          <p style={{ margin: '8px 0 20px 0', fontSize: '0.86rem', color: 'var(--text-secondary)', maxWidth: '450px', marginLeft: 'auto', marginRight: 'auto' }}>
            Click below to look up this word in the comprehensive dictionary database.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => performLookup(searchQuery)}
              className="btn-primary"
              style={{ padding: '8px 20px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Search size={14} />
              <span>Look Up "{searchQuery}"</span>
            </button>
            <button
              onClick={() => { setSearchQuery(''); setBrowseAllMode(false); }}
              className="btn-secondary"
              style={{ padding: '8px 18px', fontSize: '0.85rem' }}
            >
              Back to Book Index
            </button>
          </div>
        </div>
      )}

      {/* Pagination Load More */}
      {isShowingFilteredCards && vocabulary.length > visibleCount && (
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button
            onClick={() => setVisibleCount(c => c + 30)}
            className="btn-secondary"
            style={{ padding: '8px 24px', fontSize: '0.85rem' }}
          >
            Load More Words ({vocabulary.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
}
