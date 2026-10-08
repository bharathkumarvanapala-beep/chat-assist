import React, { useState, useEffect, useCallback } from 'react';
import { Bookmark, Search, Star, Plus, Copy, Check, Trash2, Volume2, RefreshCw, CheckCircle2, WifiOff } from 'lucide-react';
import { idbService } from '../services/db/indexedDbService.js';
import { contentSyncService } from '../services/contentSyncService.js';
import { voiceService } from '../services/voiceService.js';

export default function PhrasebookPage() {
  const [phrases, setPhrases] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [activeVoiceId, setActiveVoiceId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [syncState, setSyncState] = useState(() => contentSyncService.getState());
  const [visibleCount, setVisibleCount] = useState(30);

  // New Custom Phrase Form State
  const [newPhrase, setNewPhrase] = useState({
    english: '',
    hindi: '',
    telugu: '',
    category: 'Common Replies',
    userNote: ''
  });

  // Load content from IndexedDB
  const loadData = useCallback(async () => {
    try {
      // Load categories dynamically from IndexedDB
      let dbCategories = await idbService.getAllCategories('phrasebook');
      let catNames = ['All', ...dbCategories.map(c => c.name), 'Custom'];
      setCategories(catNames);

      // Load phrases dynamically with filters
      let items = await idbService.getAllPhrases({
        category: selectedCategory,
        search: searchQuery,
        onlyFavorites,
        onlyCustom: selectedCategory === 'Custom'
      });

      // If IndexedDB returned 0 items on an unfiltered view, attempt an immediate fallback sync from the backend API
      if (items.length === 0 && selectedCategory === 'All' && !searchQuery && !onlyFavorites) {
        try {
          const apiRes = await fetch('http://localhost:5000/api/v1/phrases?limit=200');
          if (apiRes.ok) {
            const apiJson = await apiRes.json();
            if (apiJson.success && Array.isArray(apiJson.data) && apiJson.data.length > 0) {
              await idbService.putPhrasesList(apiJson.data);
              const catRes = await fetch('http://localhost:5000/api/v1/categories');
              if (catRes.ok) {
                const catJson = await catRes.json();
                if (catJson.success && Array.isArray(catJson.data)) {
                  await idbService.putCategoriesList(catJson.data);
                  dbCategories = await idbService.getAllCategories('phrasebook');
                  setCategories(['All', ...dbCategories.map(c => c.name), 'Custom']);
                }
              }
              items = await idbService.getAllPhrases({
                category: selectedCategory,
                search: searchQuery,
                onlyFavorites,
                onlyCustom: selectedCategory === 'Custom'
              });
            }
          }
        } catch (fetchErr) {
          console.warn('[Phrasebook] Direct API fallback unavailable (offline):', fetchErr.message);
        }
      }

      setPhrases(items);
    } catch (err) {
      console.error('[Phrasebook] Failed to load from IndexedDB:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, searchQuery, onlyFavorites]);

  // Initial load and sync listener setup
  useEffect(() => {
    loadData();

    // Subscribe to background sync updates
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

  // Toggle user-specific favorite
  const handleToggleFavorite = async (id) => {
    const nextFav = await idbService.togglePhraseFavorite(id);
    setPhrases(prev => prev.map(p => p.id === id ? { ...p, isFavorite: nextFav } : p));
  };

  // Delete custom phrase
  const handleDeleteCustomPhrase = async (id) => {
    await idbService.deleteCustomPhrase(id);
    setPhrases(prev => prev.filter(p => p.id !== id));
  };

  const handleCopy = (text, idKey) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedId(idKey);
    setTimeout(() => setCopiedId(null), 2000);
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

  const handleAddCustomPhrase = async (e) => {
    e.preventDefault();
    if (!newPhrase.english.trim() || !newPhrase.hindi.trim()) return;

    await idbService.addCustomPhrase(newPhrase);
    setNewPhrase({
      english: '',
      hindi: '',
      telugu: '',
      category: 'Common Replies',
      userNote: ''
    });
    setShowAddModal(false);
    await loadData();
  };

  const handleManualSync = async () => {
    await contentSyncService.syncWithBackend(true);
    await loadData();
  };

  const visibleItems = phrases.slice(0, visibleCount);

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bookmark size={26} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '1.5rem', margin: 0 }}>My Phrasebook</h2>

            {/* Sync & Offline Status Indicator */}
            {!syncState.isOnline ? (
              <span className="badge-pill" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem' }}>
                <WifiOff size={11} /> Offline mode — showing saved phrases
              </span>
            ) : (
              <span className="badge-pill badge-on-device" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem' }}>
                <CheckCircle2 size={11} color="#10b981" /> Dynamic Database • Synced
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
            Database-driven phrasebook for English, Hindi, and Telugu. Reusable conversational language.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleManualSync}
            disabled={syncState.isSyncing || !syncState.isOnline}
            className="btn-secondary"
            style={{ padding: '6px 14px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            title="Check server for newly updated phrases"
          >
            <RefreshCw size={13} className={syncState.isSyncing ? 'pulsing-indicator' : ''} />
            <span>{syncState.isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary"
            style={{ padding: '8px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} />
            <span>Add Custom Phrase</span>
          </button>
        </div>
      </div>

      {/* Search and Category Filters */}
      <div className="glass-card" style={{ padding: '16px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search phrases in English, Hindi, or Telugu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '36px' }}
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <input
              type="checkbox"
              checked={onlyFavorites}
              onChange={(e) => setOnlyFavorites(e.target.checked)}
            />
            <span>Favorites Only</span>
          </label>
        </div>

        {/* Dynamic Categories Bar from Backend / DB */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
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
      </div>

      {/* Phrases Grid */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          Loading saved phrases...
        </div>
      ) : visibleItems.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {visibleItems.map(item => (
            <div
              key={item.id}
              className="glass-card"
              style={{ padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="badge-pill" style={{ fontSize: '0.72rem' }}>
                      {item.category}
                    </span>
                    {item.source === 'user' && (
                      <span className="badge-pill" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontSize: '0.7rem' }}>
                        Custom
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => handleToggleFavorite(item.id)}
                      className="btn-icon"
                      style={{ padding: '4px' }}
                      title={item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Star size={16} fill={item.isFavorite ? '#f59e0b' : 'none'} color={item.isFavorite ? '#f59e0b' : 'var(--text-muted)'} />
                    </button>
                    {item.source === 'user' && (
                      <button
                        onClick={() => handleDeleteCustomPhrase(item.id)}
                        className="btn-icon"
                        style={{ padding: '4px' }}
                        title="Delete custom phrase"
                      >
                        <Trash2 size={16} color="var(--text-muted)" />
                      </button>
                    )}
                  </div>
                </div>

                {/* English Phrase */}
                <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {item.english}
                </div>

                {/* Hindi Phrase */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                    {item.hindi}
                  </div>
                  <button
                    onClick={() => handlePronounce(item.hindi, 'hi', `hi-${item.id}`)}
                    className="btn-icon"
                    style={{ padding: '2px 4px' }}
                    title="Listen to Hindi pronunciation"
                  >
                    <Volume2 size={13} color={activeVoiceId === `hi-${item.id}` ? 'var(--accent-primary)' : 'var(--text-muted)'} />
                  </button>
                </div>

                {/* Telugu Phrase */}
                {item.telugu && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', color: '#10b981', marginBottom: '10px' }}>
                    <span><strong>Telugu:</strong> {item.telugu}</span>
                    <button
                      onClick={() => handlePronounce(item.telugu, 'te', `te-${item.id}`)}
                      className="btn-icon"
                      style={{ padding: '2px 4px' }}
                      title="Listen to Telugu pronunciation"
                    >
                      <Volume2 size={12} color={activeVoiceId === `te-${item.id}` ? '#10b981' : 'var(--text-muted)'} />
                    </button>
                  </div>
                )}

                {/* Note */}
                {(item.note || item.userNote) && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', background: 'var(--bg-tertiary)', padding: '6px 10px', borderRadius: 'var(--radius-sm)' }}>
                    📝 Note: {item.note || item.userNote}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                <button
                  onClick={() => handleCopy(item.hindi, `hi-${item.id}`)}
                  className="btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  {copiedId === `hi-${item.id}` ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                  <span>Copy Hindi</span>
                </button>
                <button
                  onClick={() => handleCopy(item.english, `en-${item.id}`)}
                  className="btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  {copiedId === `en-${item.id}` ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                  <span>Copy English</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <Bookmark size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>No phrases matched your criteria.</p>
          <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem' }}>
            Try searching another keyword or add a custom phrase.
          </p>
        </div>
      )}

      {/* Pagination Load More */}
      {phrases.length > visibleCount && (
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button
            onClick={() => setVisibleCount(c => c + 30)}
            className="btn-secondary"
            style={{ padding: '8px 24px', fontSize: '0.85rem' }}
          >
            Load More Phrases ({phrases.length - visibleCount} remaining)
          </button>
        </div>
      )}

      {/* Add Custom Phrase Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px'
        }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '480px', padding: '24px', background: 'var(--bg-secondary)' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Save Custom Phrase</h3>
            <form onSubmit={handleAddCustomPhrase} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                placeholder="English Phrase"
                required
                className="input-field"
                value={newPhrase.english}
                onChange={(e) => setNewPhrase({ ...newPhrase, english: e.target.value })}
              />
              <input
                type="text"
                placeholder="Hindi Translation"
                required
                className="input-field"
                value={newPhrase.hindi}
                onChange={(e) => setNewPhrase({ ...newPhrase, hindi: e.target.value })}
              />
              <input
                type="text"
                placeholder="Telugu Translation (optional)"
                className="input-field"
                value={newPhrase.telugu}
                onChange={(e) => setNewPhrase({ ...newPhrase, telugu: e.target.value })}
              />
              <select
                className="input-field"
                value={newPhrase.category}
                onChange={(e) => setNewPhrase({ ...newPhrase, category: e.target.value })}
              >
                {categories.filter(c => c !== 'All').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <textarea
                rows={2}
                placeholder="Personal note (context, reminder)..."
                className="input-field"
                value={newPhrase.userNote}
                onChange={(e) => setNewPhrase({ ...newPhrase, userNote: e.target.value })}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save to Phrasebook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
