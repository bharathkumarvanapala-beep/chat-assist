import React, { useState } from 'react';
import { History, Search, Trash2, Download, Upload, Star, Copy, Check, Lock, Unlock, ShieldAlert, Sparkles } from 'lucide-react';
import { storageService } from '../services/storageService';

export default function HistoryPage({ settings, onUpdateSettings, isLocked, setIsLocked }) {
  const [history, setHistory] = useState(() => storageService.getHistory());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [myLanguageMode, setMyLanguageMode] = useState(false); // Section 83: My Language unified search
  const [copiedId, setCopiedId] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [exportWarningOpen, setExportWarningOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('json');
  const [notice, setNotice] = useState('');

  // Categories
  const categories = ['All', 'Today', 'Favorites', 'EN → HI', 'HI → EN', 'TE → HI', 'HI → TE'];

  const filteredHistory = history.filter(item => {
    if (filterCategory === 'Favorites' && !item.isFavorite) return false;
    if (filterCategory === 'Today') {
      const startOfDay = new Date().setHours(0, 0, 0, 0);
      if (item.timestamp < startOfDay) return false;
    }
    if (filterCategory.includes('→') && item.direction !== filterCategory) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (item.originalText && item.originalText.toLowerCase().includes(q)) ||
      (item.translatedText && item.translatedText.toLowerCase().includes(q)) ||
      (item.label && item.label.toLowerCase().includes(q))
    );
  });

  // Unified "My Language" Results (Searches across Phrasebook & Vocabulary too)
  const unifiedPhrasebook = myLanguageMode ? storageService.getPhrasebook().filter(p => {
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase();
    return p.english?.toLowerCase().includes(q) || p.hindi?.toLowerCase().includes(q) || p.telugu?.toLowerCase().includes(q);
  }) : [];

  const unifiedVocab = myLanguageMode ? storageService.getVocabulary().filter(v => {
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase();
    return v.english?.toLowerCase().includes(q) || v.hindi?.toLowerCase().includes(q) || v.telugu?.toLowerCase().includes(q);
  }) : [];

  const handleToggleHistoryEnabled = (enabled) => {
    onUpdateSettings({ historyEnabled: enabled });
    if (!enabled) {
      setNotice('Translation history has been turned OFF. No new translations will be recorded.');
    } else {
      setNotice('Translation history turned ON. Translations stored securely on your local device only.');
    }
    setTimeout(() => setNotice(''), 3000);
  };

  const handleToggleProtection = (enabled) => {
    onUpdateSettings({ historyProtectionEnabled: enabled });
    setNotice(enabled ? 'History Protection ENABLED.' : 'History Protection disabled.');
    setTimeout(() => setNotice(''), 2500);
  };

  const handleUnlock = (e) => {
    e.preventDefault();
    if (pinInput === settings.historyPin) {
      setIsLocked(false);
      setPinError(false);
      setPinInput('');
    } else {
      setPinError(true);
    }
  };

  const handleToggleFavorite = (id) => {
    const updated = storageService.toggleHistoryFavorite(id);
    setHistory(updated);
  };

  const handleDeleteItem = (id) => {
    const updated = storageService.deleteHistoryItem(id);
    setHistory(updated);
  };

  const handleDeleteToday = () => {
    if (window.confirm("Are you sure you want to delete today's translation history?")) {
      const updated = storageService.clearTodayHistory();
      setHistory(updated);
      setNotice("Today's history cleared.");
      setTimeout(() => setNotice(''), 2000);
    }
  };

  const handleDeleteAll = () => {
    if (window.confirm("CAUTION: This will delete ALL local translation history permanently. Proceed?")) {
      const updated = storageService.clearAllHistory();
      setHistory(updated);
      setNotice("All local history deleted permanently.");
      setTimeout(() => setNotice(''), 2000);
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportDownload = () => {
    const { data, mimeType, extension } = storageService.exportHistory(exportFormat);
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hindi-assist-history-${new Date().toISOString().slice(0, 10)}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
    setExportWarningOpen(false);
    setNotice(`History exported as .${extension}`);
    setTimeout(() => setNotice(''), 2500);
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      const res = storageService.importHistory(content);
      if (res.success) {
        setHistory(storageService.getHistory());
        setNotice(`Successfully imported ${res.count} history items!`);
      } else {
        alert(`Import failed: ${res.error}`);
      }
      setTimeout(() => setNotice(''), 3000);
    };
    reader.readAsText(file);
  };

  // IF LOCKED: Show Security Authenticator
  if (settings.historyProtectionEnabled && isLocked) {
    return (
      <div className="glass-card animate-fade-in" style={{ maxWidth: '440px', margin: '40px auto', padding: '32px', textAlign: 'center' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
          <Lock size={28} color="#f59e0b" />
        </div>
        <h3 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>History Protection Active</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '20px' }}>
          Enter your Device PIN or authenticate to unlock your private translation history.
        </p>

        <form onSubmit={handleUnlock} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="password"
            maxLength={6}
            placeholder="Enter PIN (Default: 1234)"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            className="input-field"
            style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '4px' }}
          />

          {pinError && (
            <div style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 600 }}>
              Incorrect PIN. (Default test PIN is 1234)
            </div>
          )}

          <button type="submit" className="btn-primary" style={{ padding: '10px' }}>
            Unlock History
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Title & Privacy Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={24} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Translation History & "My Language"</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
            Private by default. Never uploaded to cloud without explicit consent.
          </p>
        </div>

        {/* Global History Toggle & Protection Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer', background: 'var(--bg-tertiary)', padding: '6px 12px', borderRadius: 'var(--radius-sm)' }}>
            <input
              type="checkbox"
              checked={settings.historyEnabled}
              onChange={(e) => handleToggleHistoryEnabled(e.target.checked)}
            />
            <span>History {settings.historyEnabled ? 'ON' : 'OFF (Private)'}</span>
          </label>

          <button
            onClick={() => handleToggleProtection(!settings.historyProtectionEnabled)}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {settings.historyProtectionEnabled ? <><Lock size={14} color="#f59e0b" /> Protected</> : <><Unlock size={14} /> Unprotected</>}
          </button>
        </div>
      </div>

      {notice && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          color: '#10b981',
          padding: '8px 16px',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '16px',
          fontWeight: 600,
          fontSize: '0.88rem'
        }}>
          ✓ {notice}
        </div>
      )}

      {/* History Disabled Warning Card */}
      {!settings.historyEnabled && (
        <div className="glass-card" style={{ padding: '20px', marginBottom: '20px', background: 'rgba(99, 102, 241, 0.08)', border: '1.5px dashed var(--accent-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <ShieldAlert size={20} color="var(--accent-primary)" />
            <h4 style={{ margin: 0, fontSize: '1rem' }}>History is Currently Disabled (Privacy Default)</h4>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            In accordance with Hindi Assist privacy rules, past translations are not recorded until you explicitly toggle History ON.
          </p>
          <button onClick={() => handleToggleHistoryEnabled(true)} className="btn-primary" style={{ padding: '6px 16px', fontSize: '0.82rem' }}>
            Enable Private Local History
          </button>
        </div>
      )}

      {/* Search Bar & My Language Mode Switcher */}
      <div className="glass-card" style={{ padding: '16px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder={myLanguageMode ? "Search across History, Phrasebook, and Vocabulary..." : "Search translation history (EN, HI, TE)..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '36px' }}
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer', background: myLanguageMode ? 'var(--badge-bg)' : 'transparent', padding: '6px 10px', borderRadius: 'var(--radius-sm)' }}>
            <input
              type="checkbox"
              checked={myLanguageMode}
              onChange={(e) => setMyLanguageMode(e.target.checked)}
            />
            <span style={{ fontWeight: 600 }}>🌟 "My Language" Search</span>
          </label>
        </div>

        {/* Categories Bar & Management Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                style={{
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-full)',
                  border: filterCategory === cat ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  background: filterCategory === cat ? 'var(--accent-gradient)' : 'var(--bg-tertiary)',
                  color: filterCategory === cat ? '#fff' : 'var(--text-secondary)',
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

          {/* Export / Import & Delete Buttons */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setExportWarningOpen(true)}
              className="btn-secondary"
              style={{ padding: '4px 10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              title="Export History (TXT, CSV, JSON)"
            >
              <Download size={13} />
              <span>Export</span>
            </button>

            <label className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <Upload size={13} />
              <span>Import</span>
              <input type="file" accept=".json" onChange={handleImportFile} style={{ display: 'none' }} />
            </label>

            <button
              onClick={handleDeleteToday}
              className="btn-secondary"
              style={{ padding: '4px 10px', fontSize: '0.78rem' }}
              title="Delete today's translations"
            >
              Clear Today
            </button>

            <button
              onClick={handleDeleteAll}
              className="btn-secondary"
              style={{ padding: '4px 10px', fontSize: '0.78rem', color: '#ef4444' }}
              title="Delete all history"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Unified Search Mode: Extra sections for Phrasebook and Vocabulary */}
      {myLanguageMode && searchQuery && (
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '1rem', marginBottom: '8px' }}>Phrasebook Matches ({unifiedPhrasebook.length})</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px', marginBottom: '16px' }}>
            {unifiedPhrasebook.map(p => (
              <div key={p.id} className="glass-card" style={{ padding: '12px' }}>
                <div style={{ fontWeight: 600 }}>{p.english}</div>
                <div style={{ color: 'var(--accent-primary)' }}>{p.hindi}</div>
              </div>
            ))}
          </div>

          <h4 style={{ fontSize: '1rem', marginBottom: '8px' }}>Vocabulary Matches ({unifiedVocab.length})</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px', marginBottom: '16px' }}>
            {unifiedVocab.map(v => (
              <div key={v.id} className="glass-card" style={{ padding: '12px' }}>
                <div style={{ fontWeight: 600 }}>{v.english}</div>
                <div style={{ color: 'var(--accent-primary)' }}>{v.hindi} ({v.telugu})</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History Items List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredHistory.map(item => (
          <div key={item.id} className="glass-card" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge-pill" style={{ fontSize: '0.72rem' }}>
                  {item.direction}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {new Date(item.timestamp).toLocaleString()}
                </span>
                <span className="badge-pill badge-on-device" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                  {item.translationMode}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => handleToggleFavorite(item.id)}
                  className="btn-icon"
                  style={{ padding: '4px' }}
                >
                  <Star size={16} fill={item.isFavorite ? '#f59e0b' : 'none'} color={item.isFavorite ? '#f59e0b' : 'var(--text-muted)'} />
                </button>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="btn-icon"
                  style={{ padding: '4px' }}
                  title="Delete item"
                >
                  <Trash2 size={16} color="var(--text-muted)" />
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Original</span>
                <div style={{ fontSize: '0.98rem', fontWeight: 500 }}>{item.originalText}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Translation</span>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--accent-primary)' }}>{item.translatedText}</div>
              </div>
            </div>

            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
              <button
                onClick={() => handleCopy(item.translatedText, `trans-${item.id}`)}
                className="btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                {copiedId === `trans-${item.id}` ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                <span>Copy Translation</span>
              </button>
              <button
                onClick={() => handleCopy(item.originalText, `orig-${item.id}`)}
                className="btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                {copiedId === `orig-${item.id}` ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                <span>Copy Original</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredHistory.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          {settings.historyEnabled ? 'Your saved translations will appear here.' : 'History is currently disabled.'}
        </div>
      )}

      {/* Export Dialog Warning (Section 27: 238. Warn user) */}
      {exportWarningOpen && (
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
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '440px', padding: '24px', background: 'var(--bg-secondary)' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Export Private Translation History</h3>
            <p style={{ color: '#f59e0b', fontSize: '0.85rem', fontWeight: 600, marginBottom: '14px' }}>
              ⚠️ Privacy Warning: Exporting history creates an unencrypted external copy of your private translations.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Select File Format:
              </label>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                className="input-field"
              >
                <option value="json">JSON (Structured format for re-import)</option>
                <option value="csv">CSV (Spreadsheet compatible)</option>
                <option value="txt">TXT (Plain readable text document)</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setExportWarningOpen(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleExportDownload} className="btn-primary">
                Confirm & Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
