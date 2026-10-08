import React, { useState, useEffect, useCallback } from 'react';
import {
  Sliders,
  BookA,
  Bookmark,
  Layers,
  Upload,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Lock,
  Unlock,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { adminApiService } from '../services/adminApiService.js';

export default function AdminContentPage() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminKeyInput, setAdminKeyInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState('vocabulary'); // 'vocabulary' | 'phrases' | 'categories' | 'import'

  // Data states
  const [categories, setCategories] = useState([]);
  const [vocabList, setVocabList] = useState([]);
  const [phraseList, setPhraseList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ text: '', type: 'info' });

  // Filter / Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [showInactive, setShowInactive] = useState(true);

  // Modals
  const [vocabModal, setVocabModal] = useState({ open: false, isEditing: false, data: null });
  const [phraseModal, setPhraseModal] = useState({ open: false, isEditing: false, data: null });
  const [catModal, setCatModal] = useState({ open: false, isEditing: false, data: null });

  // Bulk Import state
  const [importType, setImportType] = useState('phrases');
  const [csvText, setCsvText] = useState('');
  const [importResult, setImportResult] = useState(null);

  // Verify existing session on mount
  useEffect(() => {
    const existingKey = adminApiService.getAdminKey();
    if (existingKey) {
      adminApiService.verifyAdminKey(existingKey)
        .then(() => setIsAdminAuthenticated(true))
        .catch(() => adminApiService.clearAdminKey());
    }
  }, []);

  const showNotice = (text, type = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage({ text: '', type: 'info' }), 4000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      await adminApiService.verifyAdminKey(adminKeyInput.trim());
      setIsAdminAuthenticated(true);
      setAdminKeyInput('');
      showNotice('Admin authentication successful. Content management unlocked.');
    } catch (err) {
      setAuthError(err.message || 'Invalid administrator key.');
    }
  };

  const handleLogout = () => {
    adminApiService.clearAdminKey();
    setIsAdminAuthenticated(false);
    showNotice('Admin session locked.');
  };

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!isAdminAuthenticated) return;
    setLoading(true);
    try {
      // Fetch categories
      const catRes = await fetch(`http://localhost:5000/api/v1/categories?includeInactive=true`);
      const catJson = await catRes.json();
      if (catJson.success) setCategories(catJson.data);

      if (activeTab === 'vocabulary') {
        const vRes = await fetch(`http://localhost:5000/api/v1/vocabulary?limit=200&includeInactive=true`);
        const vJson = await vRes.json();
        if (vJson.success) setVocabList(vJson.data);
      } else if (activeTab === 'phrases') {
        const pRes = await fetch(`http://localhost:5000/api/v1/phrases?limit=200&includeInactive=true`);
        const pJson = await pRes.json();
        if (pJson.success) setPhraseList(pJson.data);
      }
    } catch (err) {
      showNotice(`Failed to fetch records: ${err.message}`, 'danger');
    } finally {
      setLoading(false);
    }
  }, [isAdminAuthenticated, activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ==========================================
  // VOCABULARY ACTIONS
  // ==========================================
  const handleSaveVocab = async (e) => {
    e.preventDefault();
    const data = vocabModal.data;
    try {
      if (vocabModal.isEditing) {
        await adminApiService.updateVocabulary(data.id, data);
        showNotice(`Vocabulary word "${data.english}" updated successfully.`);
      } else {
        await adminApiService.createVocabulary(data);
        showNotice(`New vocabulary word "${data.english}" created.`);
      }
      setVocabModal({ open: false, isEditing: false, data: null });
      fetchData();
    } catch (err) {
      showNotice(err.message, 'danger');
    }
  };

  const handleToggleVocabStatus = async (vocab) => {
    try {
      await adminApiService.updateVocabulary(vocab.id, { isActive: !vocab.isActive });
      showNotice(`Word "${vocab.english}" is now ${!vocab.isActive ? 'Active' : 'Inactive (Soft deleted)'}.`);
      fetchData();
    } catch (err) {
      showNotice(err.message, 'danger');
    }
  };

  const handleDeleteVocab = async (id, isHard = false) => {
    if (!window.confirm(`Are you sure you want to ${isHard ? 'permanently delete' : 'deactivate'} this word?`)) return;
    try {
      await adminApiService.deleteVocabulary(id, isHard);
      showNotice(isHard ? 'Word permanently deleted.' : 'Word deactivated.');
      fetchData();
    } catch (err) {
      showNotice(err.message, 'danger');
    }
  };

  // ==========================================
  // PHRASE ACTIONS
  // ==========================================
  const handleSavePhrase = async (e) => {
    e.preventDefault();
    const data = phraseModal.data;
    try {
      if (phraseModal.isEditing) {
        await adminApiService.updatePhrase(data.id, data);
        showNotice(`Phrase "${data.english}" updated successfully.`);
      } else {
        await adminApiService.createPhrase(data);
        showNotice(`New phrase "${data.english}" created.`);
      }
      setPhraseModal({ open: false, isEditing: false, data: null });
      fetchData();
    } catch (err) {
      showNotice(err.message, 'danger');
    }
  };

  const handleTogglePhraseStatus = async (phrase) => {
    try {
      await adminApiService.updatePhrase(phrase.id, { isActive: !phrase.isActive });
      showNotice(`Phrase "${phrase.english}" is now ${!phrase.isActive ? 'Active' : 'Inactive (Soft deleted)'}.`);
      fetchData();
    } catch (err) {
      showNotice(err.message, 'danger');
    }
  };

  const handleDeletePhrase = async (id, isHard = false) => {
    if (!window.confirm(`Are you sure you want to ${isHard ? 'permanently delete' : 'deactivate'} this phrase?`)) return;
    try {
      await adminApiService.deletePhrase(id, isHard);
      showNotice(isHard ? 'Phrase permanently deleted.' : 'Phrase deactivated.');
      fetchData();
    } catch (err) {
      showNotice(err.message, 'danger');
    }
  };

  // ==========================================
  // CATEGORY ACTIONS
  // ==========================================
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    const data = catModal.data;
    try {
      if (catModal.isEditing) {
        await adminApiService.updateCategory(data.id, data);
        showNotice(`Category "${data.name}" updated successfully.`);
      } else {
        await adminApiService.createCategory(data);
        showNotice(`New category "${data.name}" created.`);
      }
      setCatModal({ open: false, isEditing: false, data: null });
      fetchData();
    } catch (err) {
      showNotice(err.message, 'danger');
    }
  };

  const handleDeleteCategory = async (id, isHard = false) => {
    if (!window.confirm(`Are you sure you want to ${isHard ? 'permanently delete' : 'deactivate'} this category?`)) return;
    try {
      await adminApiService.deleteCategory(id, isHard);
      showNotice(isHard ? 'Category permanently deleted.' : 'Category deactivated.');
      fetchData();
    } catch (err) {
      showNotice(err.message, 'danger');
    }
  };

  // ==========================================
  // BULK IMPORT ACTION
  // ==========================================
  const handleBulkImport = async (e) => {
    e.preventDefault();
    if (!csvText.trim()) return;
    setImportResult(null);
    try {
      const res = await adminApiService.bulkImport(importType, { csvContent: csvText });
      setImportResult(res.result);
      showNotice(`Bulk import completed: ${res.result.imported} imported, ${res.result.rejected} rejected.`);
      fetchData();
    } catch (err) {
      showNotice(`Import failed: ${err.message}`, 'danger');
    }
  };

  // Render Login Lockscreen if unauthenticated
  if (!isAdminAuthenticated) {
    return (
      <div className="animate-fade-in" style={{ maxWidth: '480px', margin: '80px auto', padding: '20px' }}>
        <div className="glass-card" style={{ padding: '32px', textAlign: 'center' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'rgba(79, 70, 229, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto'
          }}>
            <Lock size={28} color="var(--accent-primary)" />
          </div>

          <h2 style={{ fontSize: '1.4rem', margin: '0 0 6px 0' }}>Webmaster Content Control</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', margin: '0 0 24px 0' }}>
            Enter your admin passkey to add, edit, soft-delete, or bulk-import official language records.
          </p>

          {authError && (
            <div style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', padding: '10px', borderRadius: 'var(--radius-sm)', marginBottom: '16px', fontSize: '0.85rem' }}>
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <input
              type="password"
              placeholder="Admin Passkey (e.g. admin_secret_key_2026)"
              required
              className="input-field"
              value={adminKeyInput}
              onChange={(e) => setAdminKeyInput(e.target.value)}
              style={{ fontSize: '1rem', padding: '10px 14px' }}
            />

            <button type="submit" className="btn-primary" style={{ padding: '10px 18px', fontWeight: 600 }}>
              Unlock Content Management
            </button>
          </form>

          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '20px' }}>
            Configured in <code>backend/.env</code> under <code>ADMIN_API_KEY</code>.
          </p>
        </div>
      </div>
    );
  }

  // Filtered items
  const filteredVocab = vocabList.filter(item => {
    if (!showInactive && !item.isActive) return false;
    if (selectedCat !== 'All' && item.category !== selectedCat && item.categoryId !== selectedCat) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (item.english && item.english.toLowerCase().includes(q)) ||
      (item.hindi && item.hindi.toLowerCase().includes(q)) ||
      (item.telugu && item.telugu.toLowerCase().includes(q))
    );
  });

  const filteredPhrases = phraseList.filter(item => {
    if (!showInactive && !item.isActive) return false;
    if (selectedCat !== 'All' && item.category !== selectedCat && item.categoryId !== selectedCat) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (item.english && item.english.toLowerCase().includes(q)) ||
      (item.hindi && item.hindi.toLowerCase().includes(q)) ||
      (item.telugu && item.telugu.toLowerCase().includes(q)) ||
      (item.note && item.note.toLowerCase().includes(q))
    );
  });

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1150px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sliders size={26} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Content Management (Webmaster)</h2>
            <span className="badge-pill badge-cloud" style={{ fontSize: '0.72rem' }}>
              <Unlock size={11} /> Admin Active
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
            Direct database control for official vocabulary, phrases, and categories. Changes propagate immediately to all devices via sync.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="btn-secondary"
          style={{ padding: '6px 14px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Lock size={13} />
          <span>Lock Admin Session</span>
        </button>
      </div>

      {/* Notice Banner */}
      {statusMessage.text && (
        <div style={{
          background: statusMessage.type === 'danger' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
          color: statusMessage.type === 'danger' ? '#ef4444' : '#10b981',
          padding: '10px 16px',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '16px',
          fontSize: '0.88rem',
          fontWeight: 600
        }}>
          {statusMessage.text}
        </div>
      )}

      {/* Admin Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '20px' }}>
        {[
          { id: 'vocabulary', label: 'Vocabulary', icon: BookA, count: vocabList.length },
          { id: 'phrases', label: 'Phrasebook', icon: Bookmark, count: phraseList.length },
          { id: 'categories', label: 'Categories', icon: Layers, count: categories.length },
          { id: 'import', label: 'Bulk CSV Import', icon: Upload }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearchQuery(''); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                border: 'none',
                background: 'transparent',
                borderBottom: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
                color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.92rem',
                cursor: 'pointer'
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="badge-pill" style={{ fontSize: '0.7rem', padding: '1px 6px' }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: VOCABULARY */}
      {activeTab === 'vocabulary' && (
        <div>
          <div className="glass-card" style={{ padding: '16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, minWidth: '240px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Filter vocabulary..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '32px' }}
                />
              </div>

              <select
                value={selectedCat}
                onChange={(e) => setSelectedCat(e.target.value)}
                className="input-field"
                style={{ width: '160px' }}
              >
                <option value="All">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
                <span>Show Deactivated</span>
              </label>
            </div>

            <button
              onClick={() => setVocabModal({
                open: true,
                isEditing: false,
                data: {
                  english: '',
                  hindi: '',
                  telugu: '',
                  transliteration: '',
                  pronunciation: '',
                  definition: '',
                  exampleEnglish: '',
                  exampleHindi: '',
                  exampleTelugu: '',
                  category: categories[0]?.name || 'Conversational',
                  categoryId: categories[0]?.id || 'cat-conversational',
                  tags: [],
                  isActive: true
                }
              })}
              className="btn-primary"
              style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={15} />
              <span>Add Vocabulary</span>
            </button>
          </div>

          {/* Vocabulary Table */}
          <div className="glass-card" style={{ overflowX: 'auto', padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                  <th style={{ padding: '12px 16px' }}>ENGLISH</th>
                  <th style={{ padding: '12px 16px' }}>HINDI (TRANSLITERATION)</th>
                  <th style={{ padding: '12px 16px' }}>TELUGU</th>
                  <th style={{ padding: '12px 16px' }}>CATEGORY</th>
                  <th style={{ padding: '12px 16px' }}>STATUS</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredVocab.map(v => (
                  <tr key={v.id} style={{ borderBottom: '1px solid var(--border-subtle)', opacity: v.isActive ? 1 : 0.55 }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{v.english}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{v.hindi}</span>
                      {v.transliteration && <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginLeft: '6px' }}>({v.transliteration})</span>}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#10b981' }}>{v.telugu || '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="badge-pill" style={{ fontSize: '0.7rem' }}>{v.category}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        onClick={() => handleToggleVocabStatus(v)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: v.isActive ? '#10b981' : 'var(--text-muted)',
                          fontSize: '0.78rem',
                          fontWeight: 600
                        }}
                        title={v.isActive ? 'Click to deactivate' : 'Click to activate'}
                      >
                        {v.isActive ? <><CheckCircle2 size={13} /> Active</> : <><XCircle size={13} /> Inactive</>}
                      </button>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => setVocabModal({ open: true, isEditing: true, data: { ...v } })}
                        className="btn-icon"
                        style={{ marginRight: '6px' }}
                        title="Edit vocabulary"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteVocab(v.id, false)}
                        className="btn-icon"
                        title="Deactivate word"
                      >
                        <Trash2 size={14} color="#ef4444" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PHRASES */}
      {activeTab === 'phrases' && (
        <div>
          <div className="glass-card" style={{ padding: '16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, minWidth: '240px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Filter phrases..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '32px' }}
                />
              </div>

              <select
                value={selectedCat}
                onChange={(e) => setSelectedCat(e.target.value)}
                className="input-field"
                style={{ width: '160px' }}
              >
                <option value="All">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
                <span>Show Deactivated</span>
              </label>
            </div>

            <button
              onClick={() => setPhraseModal({
                open: true,
                isEditing: false,
                data: {
                  english: '',
                  hindi: '',
                  telugu: '',
                  transliteration: '',
                  pronunciation: '',
                  category: categories[0]?.name || 'Friends',
                  categoryId: categories[0]?.id || 'cat-friends',
                  note: '',
                  tags: [],
                  isActive: true
                }
              })}
              className="btn-primary"
              style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={15} />
              <span>Add Phrase</span>
            </button>
          </div>

          {/* Phrases Table */}
          <div className="glass-card" style={{ overflowX: 'auto', padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                  <th style={{ padding: '12px 16px' }}>ENGLISH PHRASE</th>
                  <th style={{ padding: '12px 16px' }}>HINDI TRANSLATION</th>
                  <th style={{ padding: '12px 16px' }}>TELUGU</th>
                  <th style={{ padding: '12px 16px' }}>CATEGORY</th>
                  <th style={{ padding: '12px 16px' }}>STATUS</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredPhrases.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border-subtle)', opacity: p.isActive ? 1 : 0.55 }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{p.english}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--accent-primary)', fontWeight: 600 }}>{p.hindi}</td>
                    <td style={{ padding: '12px 16px', color: '#10b981' }}>{p.telugu || '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="badge-pill" style={{ fontSize: '0.7rem' }}>{p.category}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        onClick={() => handleTogglePhraseStatus(p)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: p.isActive ? '#10b981' : 'var(--text-muted)',
                          fontSize: '0.78rem',
                          fontWeight: 600
                        }}
                      >
                        {p.isActive ? <><CheckCircle2 size={13} /> Active</> : <><XCircle size={13} /> Inactive</>}
                      </button>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => setPhraseModal({ open: true, isEditing: true, data: { ...p } })}
                        className="btn-icon"
                        style={{ marginRight: '6px' }}
                        title="Edit phrase"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeletePhrase(p.id, false)}
                        className="btn-icon"
                        title="Deactivate phrase"
                      >
                        <Trash2 size={14} color="#ef4444" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CATEGORIES */}
      {activeTab === 'categories' && (
        <div>
          <div className="glass-card" style={{ padding: '16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: '0 0 4px 0' }}>Manage Categories</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', margin: 0 }}>
                Categories structure vocabulary and phrase navigation dynamically.
              </p>
            </div>

            <button
              onClick={() => setCatModal({
                open: true,
                isEditing: false,
                data: {
                  name: '',
                  type: 'both',
                  description: '',
                  sortOrder: categories.length + 1,
                  isActive: true
                }
              })}
              className="btn-primary"
              style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={15} />
              <span>Add Category</span>
            </button>
          </div>

          <div className="glass-card" style={{ overflowX: 'auto', padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                  <th style={{ padding: '12px 16px' }}>NAME</th>
                  <th style={{ padding: '12px 16px' }}>TYPE</th>
                  <th style={{ padding: '12px 16px' }}>DESCRIPTION</th>
                  <th style={{ padding: '12px 16px' }}>ORDER</th>
                  <th style={{ padding: '12px 16px' }}>STATUS</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border-subtle)', opacity: c.isActive ? 1 : 0.55 }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{c.name}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="badge-pill" style={{ textTransform: 'capitalize', fontSize: '0.72rem' }}>{c.type}</span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{c.description || '—'}</td>
                    <td style={{ padding: '12px 16px' }}>{c.sortOrder}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ color: c.isActive ? '#10b981' : 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600 }}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => setCatModal({ open: true, isEditing: true, data: { ...c } })}
                        className="btn-icon"
                        style={{ marginRight: '6px' }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(c.id, false)}
                        className="btn-icon"
                      >
                        <Trash2 size={14} color="#ef4444" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: BULK CSV IMPORT */}
      {activeTab === 'import' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.15rem', margin: '0 0 6px 0' }}>Bulk CSV / JSON Language Import</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', margin: '0 0 18px 0' }}>
            Quickly import hundreds of words or phrases without writing code. Fields will be validated before insertion.
          </p>

          <form onSubmit={handleBulkImport} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <label style={{ fontSize: '0.88rem', fontWeight: 600 }}>Target Collection:</label>
              <select
                value={importType}
                onChange={(e) => setImportType(e.target.value)}
                className="input-field"
                style={{ width: '200px' }}
              >
                <option value="phrases">Phrasebook</option>
                <option value="vocabulary">Vocabulary</option>
                <option value="categories">Categories</option>
              </select>
            </div>

            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Paste CSV (with header row: <code>english,hindi,telugu,category,note</code>):
              </div>
              <textarea
                rows={8}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="english,hindi,telugu,category,note&#10;Where are you?,तुम कहाँ हो?,నువ్వు ఎక్కడ ఉన్నావు?,Friends,Common check-in&#10;Are you free now?,क्या तुम अभी फ्री हो?,నువ్వు ఇప్పుడు ఖాళీగా ఉన్నావా?,Friends,Availability"
                className="input-field"
                style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setCsvText('')}
                className="btn-secondary"
              >
                Clear
              </button>
              <button type="submit" className="btn-primary" style={{ padding: '8px 20px' }}>
                Validate & Import Data
              </button>
            </div>
          </form>

          {importResult && (
            <div style={{ marginTop: '20px', padding: '16px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem' }}>Import Execution Summary</h4>
              <div style={{ display: 'flex', gap: '20px', fontSize: '0.88rem', marginBottom: '8px' }}>
                <span style={{ color: '#10b981', fontWeight: 600 }}>✓ Imported: {importResult.imported}</span>
                <span style={{ color: importResult.rejected > 0 ? '#ef4444' : 'var(--text-muted)', fontWeight: 600 }}>✗ Rejected: {importResult.rejected}</span>
              </div>
              {importResult.errors?.length > 0 && (
                <div style={{ fontSize: '0.8rem', color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '4px' }}>
                  <strong>Errors Encountered:</strong>
                  <ul style={{ margin: '4px 0 0 0', paddingLeft: '18px' }}>
                    {importResult.errors.map((err, idx) => <li key={idx}>{err}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADD / EDIT VOCABULARY */}
      {vocabModal.open && vocabModal.data && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px'
        }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '520px', padding: '24px', background: 'var(--bg-secondary)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>
              {vocabModal.isEditing ? 'Edit Vocabulary Word' : 'Add New Vocabulary Word'}
            </h3>
            <form onSubmit={handleSaveVocab} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                placeholder="English Word (required)"
                required
                className="input-field"
                value={vocabModal.data.english}
                onChange={(e) => setVocabModal({ ...vocabModal, data: { ...vocabModal.data, english: e.target.value } })}
              />
              <input
                type="text"
                placeholder="Hindi Translation (required)"
                required
                className="input-field"
                value={vocabModal.data.hindi}
                onChange={(e) => setVocabModal({ ...vocabModal, data: { ...vocabModal.data, hindi: e.target.value } })}
              />
              <input
                type="text"
                placeholder="Hindi Transliteration (e.g. asal mein)"
                className="input-field"
                value={vocabModal.data.transliteration}
                onChange={(e) => setVocabModal({ ...vocabModal, data: { ...vocabModal.data, transliteration: e.target.value } })}
              />
              <input
                type="text"
                placeholder="Telugu Translation (optional)"
                className="input-field"
                value={vocabModal.data.telugu}
                onChange={(e) => setVocabModal({ ...vocabModal, data: { ...vocabModal.data, telugu: e.target.value } })}
              />
              <select
                className="input-field"
                value={vocabModal.data.category}
                onChange={(e) => setVocabModal({ ...vocabModal, data: { ...vocabModal.data, category: e.target.value } })}
              >
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
              <textarea
                rows={2}
                placeholder="Definition or Meaning..."
                className="input-field"
                value={vocabModal.data.definition}
                onChange={(e) => setVocabModal({ ...vocabModal, data: { ...vocabModal.data, definition: e.target.value } })}
              />
              <input
                type="text"
                placeholder="English Example Sentence"
                className="input-field"
                value={vocabModal.data.exampleEnglish}
                onChange={(e) => setVocabModal({ ...vocabModal, data: { ...vocabModal.data, exampleEnglish: e.target.value } })}
              />
              <input
                type="text"
                placeholder="Hindi Example Sentence"
                className="input-field"
                value={vocabModal.data.exampleHindi}
                onChange={(e) => setVocabModal({ ...vocabModal, data: { ...vocabModal.data, exampleHindi: e.target.value } })}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setVocabModal({ open: false, isEditing: false, data: null })} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {vocabModal.isEditing ? 'Save Changes' : 'Create Word'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT PHRASE */}
      {phraseModal.open && phraseModal.data && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px'
        }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '520px', padding: '24px', background: 'var(--bg-secondary)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>
              {phraseModal.isEditing ? 'Edit Official Phrase' : 'Add Official Phrase'}
            </h3>
            <form onSubmit={handleSavePhrase} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                placeholder="English Phrase (required)"
                required
                className="input-field"
                value={phraseModal.data.english}
                onChange={(e) => setPhraseModal({ ...phraseModal, data: { ...phraseModal.data, english: e.target.value } })}
              />
              <input
                type="text"
                placeholder="Hindi Translation (required)"
                required
                className="input-field"
                value={phraseModal.data.hindi}
                onChange={(e) => setPhraseModal({ ...phraseModal, data: { ...phraseModal.data, hindi: e.target.value } })}
              />
              <input
                type="text"
                placeholder="Telugu Translation (optional)"
                className="input-field"
                value={phraseModal.data.telugu}
                onChange={(e) => setPhraseModal({ ...phraseModal, data: { ...phraseModal.data, telugu: e.target.value } })}
              />
              <select
                className="input-field"
                value={phraseModal.data.category}
                onChange={(e) => setPhraseModal({ ...phraseModal, data: { ...phraseModal.data, category: e.target.value } })}
              >
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
              <textarea
                rows={2}
                placeholder="Conversational Context / Note..."
                className="input-field"
                value={phraseModal.data.note}
                onChange={(e) => setPhraseModal({ ...phraseModal, data: { ...phraseModal.data, note: e.target.value } })}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setPhraseModal({ open: false, isEditing: false, data: null })} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {phraseModal.isEditing ? 'Save Changes' : 'Create Phrase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT CATEGORY */}
      {catModal.open && catModal.data && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px'
        }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '440px', padding: '24px', background: 'var(--bg-secondary)' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>
              {catModal.isEditing ? 'Edit Category' : 'Create Category'}
            </h3>
            <form onSubmit={handleSaveCategory} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                placeholder="Category Name (e.g. Friends)"
                required
                className="input-field"
                value={catModal.data.name}
                onChange={(e) => setCatModal({ ...catModal, data: { ...catModal.data, name: e.target.value } })}
              />
              <select
                className="input-field"
                value={catModal.data.type}
                onChange={(e) => setCatModal({ ...catModal, data: { ...catModal.data, type: e.target.value } })}
              >
                <option value="both">Both (Vocabulary & Phrasebook)</option>
                <option value="vocabulary">Vocabulary Only</option>
                <option value="phrasebook">Phrasebook Only</option>
              </select>
              <textarea
                rows={2}
                placeholder="Category Description..."
                className="input-field"
                value={catModal.data.description}
                onChange={(e) => setCatModal({ ...catModal, data: { ...catModal.data, description: e.target.value } })}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setCatModal({ open: false, isEditing: false, data: null })} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {catModal.isEditing ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
