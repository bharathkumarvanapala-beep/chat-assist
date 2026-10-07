import React, { useState } from 'react';
import { Bookmark, Search, Star, Plus, Copy, Check, Trash2, Edit2 } from 'lucide-react';
import { storageService } from '../services/storageService';

export default function PhrasebookPage() {
  const [phrases, setPhrases] = useState(() => storageService.getPhrasebook());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Phrase Form
  const [newPhrase, setNewPhrase] = useState({
    english: '',
    hindi: '',
    telugu: '',
    category: 'Common Replies',
    tone: 'Casual',
    userNote: ''
  });

  const categories = [
    'All',
    'Greetings',
    'Friends',
    'Family',
    'Work',
    'Travel',
    'Common Replies',
    'Important',
    'Custom'
  ];

  const filtered = phrases.filter(item => {
    if (onlyFavorites && !item.isFavorite) return false;
    if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (item.english && item.english.toLowerCase().includes(q)) ||
      (item.hindi && item.hindi.toLowerCase().includes(q)) ||
      (item.telugu && item.telugu.toLowerCase().includes(q)) ||
      (item.userNote && item.userNote.toLowerCase().includes(q))
    );
  });

  const handleToggleFavorite = (id) => {
    const updated = storageService.togglePhraseFavorite(id);
    setPhrases(updated);
  };

  const handleDelete = (id) => {
    const updated = storageService.deletePhrase(id);
    setPhrases(updated);
  };

  const handleCopy = (text, id) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddPhrase = (e) => {
    e.preventDefault();
    if (!newPhrase.english.trim() || !newPhrase.hindi.trim()) return;
    const updated = storageService.addPhrase(newPhrase);
    setPhrases(updated);
    setNewPhrase({
      english: '',
      hindi: '',
      telugu: '',
      category: 'Common Replies',
      tone: 'Casual',
      userNote: ''
    });
    setShowAddModal(false);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bookmark size={24} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '1.5rem', margin: 0 }}>My Phrasebook</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
            User-selected reusable conversational language. Distinct from past translation activity.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary"
          style={{ padding: '8px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={16} />
          <span>Add Custom Phrase</span>
        </button>
      </div>

      {/* Search and Category Filters */}
      <div className="glass-card" style={{ padding: '16px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
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

      {/* Phrases Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {filtered.map(item => (
          <div key={item.id} className="glass-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
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

              <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                {item.english}
              </div>

              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '4px' }}>
                {item.hindi}
              </div>

              {item.telugu && (
                <div style={{ fontSize: '0.88rem', color: '#10b981', marginBottom: '10px' }}>
                  Telugu: {item.telugu}
                </div>
              )}

              {item.userNote && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', background: 'var(--bg-tertiary)', padding: '6px 10px', borderRadius: 'var(--radius-sm)' }}>
                  📝 Note: {item.userNote}
                </div>
              )}
            </div>

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

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Save useful phrases to build your personal phrasebook.
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
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Save to Phrasebook</h3>
            <form onSubmit={handleAddPhrase} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
