import React, { useState } from 'react';
import { BookA, Search, Star, Plus, Trash2, Volume2, Info, Check } from 'lucide-react';
import { storageService } from '../services/storageService';

export default function VocabularyPage() {
  const [vocabulary, setVocabulary] = useState(() => storageService.getVocabulary());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Word Form State
  const [newWord, setNewWord] = useState({
    english: '',
    hindi: '',
    telugu: '',
    category: 'Conversational',
    example_en: '',
    example_hi: '',
    usage_note: ''
  });

  const categories = ['All', 'Conversational', 'Work', 'Daily Life', 'Greetings', 'Time Expressions', 'Travel'];

  const filtered = vocabulary.filter(item => {
    if (onlyFavorites && !item.isFavorite) return false;
    if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (item.english && item.english.toLowerCase().includes(q)) ||
      (item.hindi && item.hindi.toLowerCase().includes(q)) ||
      (item.telugu && item.telugu.toLowerCase().includes(q)) ||
      (item.transliteration_hi && item.transliteration_hi.toLowerCase().includes(q))
    );
  });

  const handleToggleFavorite = (id) => {
    const updated = storageService.toggleWordFavorite(id);
    setVocabulary(updated);
  };

  const handleDelete = (id) => {
    const updated = storageService.deleteWord(id);
    setVocabulary(updated);
  };

  const handleAddWord = (e) => {
    e.preventDefault();
    if (!newWord.english.trim() || !newWord.hindi.trim()) return;
    const updated = storageService.addWord(newWord);
    setVocabulary(updated);
    setNewWord({
      english: '',
      hindi: '',
      telugu: '',
      category: 'Conversational',
      example_en: '',
      example_hi: '',
      usage_note: ''
    });
    setShowAddModal(false);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookA size={24} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '1.5rem', margin: 0 }}>My Vocabulary</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
            Expandable personal vocabulary resource with English, Hindi, and Telugu context.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary"
          style={{ padding: '8px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={16} />
          <span>Save Word</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="glass-card" style={{ padding: '16px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search English, Hindi, or Telugu word..."
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

        {/* Categories Bar */}
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
                whiteSpace: 'nowrap'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Words Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '16px' }}>
        {filtered.map(item => (
          <div key={item.id} className="glass-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span className="badge-pill" style={{ fontSize: '0.72rem' }}>
                  {item.category}
                </span>

                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => handleToggleFavorite(item.id)}
                    className="btn-icon"
                    style={{ padding: '4px' }}
                  >
                    <Star size={16} fill={item.isFavorite ? '#f59e0b' : 'none'} color={item.isFavorite ? '#f59e0b' : 'var(--text-muted)'} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="btn-icon"
                    style={{ padding: '4px' }}
                  >
                    <Trash2 size={16} color="var(--text-muted)" />
                  </button>
                </div>
              </div>

              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '2px' }}>
                {item.english}
              </div>

              <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--accent-primary)', marginBottom: '2px' }}>
                {item.hindi} {item.transliteration_hi && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>({item.transliteration_hi})</span>}
              </div>

              {item.telugu && (
                <div style={{ fontSize: '0.9rem', color: '#10b981', marginBottom: '10px' }}>
                  Telugu: {item.telugu}
                </div>
              )}

              {item.example_en && (
                <div style={{ background: 'var(--bg-tertiary)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', marginBottom: '8px' }}>
                  <div><strong>EN:</strong> "{item.example_en}"</div>
                  {item.example_hi && <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}><strong>HI:</strong> "{item.example_hi}"</div>}
                </div>
              )}

              {item.usage_note && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  💡 {item.usage_note}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Save words you want to remember.
        </div>
      )}

      {/* Add Word Modal */}
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
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Save Word to Vocabulary</h3>
            <form onSubmit={handleAddWord} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                placeholder="English Word (e.g. actually)"
                required
                className="input-field"
                value={newWord.english}
                onChange={(e) => setNewWord({ ...newWord, english: e.target.value })}
              />
              <input
                type="text"
                placeholder="Hindi Translation (e.g. असल में)"
                required
                className="input-field"
                value={newWord.hindi}
                onChange={(e) => setNewWord({ ...newWord, hindi: e.target.value })}
              />
              <input
                type="text"
                placeholder="Telugu Translation (optional)"
                className="input-field"
                value={newWord.telugu}
                onChange={(e) => setNewWord({ ...newWord, telugu: e.target.value })}
              />
              <input
                type="text"
                placeholder="Example Sentence (English)"
                className="input-field"
                value={newWord.example_en}
                onChange={(e) => setNewWord({ ...newWord, example_en: e.target.value })}
              />
              <textarea
                rows={2}
                placeholder="Usage Note or Nuance..."
                className="input-field"
                value={newWord.usage_note}
                onChange={(e) => setNewWord({ ...newWord, usage_note: e.target.value })}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Word
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
