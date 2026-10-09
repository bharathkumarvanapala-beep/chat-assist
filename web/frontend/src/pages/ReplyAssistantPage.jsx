import React, { useState } from 'react';
import { Reply, Copy, Check, Sparkles, Send, Edit3, Bookmark, MessageSquare } from 'lucide-react';
import { translationClient } from '../services/translationClient';
import { storageService } from '../services/storageService';

export default function ReplyAssistantPage({ settings }) {
  const [incomingMessage, setIncomingMessage] = useState('');
  const [replyContext, setReplyContext] = useState('');
  const [showContext, setShowContext] = useState(false);
  const [targetLang, setTargetLang] = useState('hi');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedText, setEditedText] = useState('');
  const [notice, setNotice] = useState('');

  const sampleMessages = [
    "Why didn't you come yesterday?",
    "Can you come tomorrow for the presentation?",
    "Bro kal meeting hai क्या?",
    "Are you free for a quick call?",
    "Please send the project file when you get time."
  ];

  const handleGenerateReplies = async (msg = incomingMessage) => {
    const textToProcess = (msg || incomingMessage).trim();
    if (!textToProcess) return;
    setIsLoading(true);
    setIncomingMessage(textToProcess);

    try {
      const results = await translationClient.getReplySuggestions(
        textToProcess,
        targetLang,
        'Casual',
        showContext ? replyContext.trim() : ''
      );
      setSuggestions(results || []);
    } catch {
      setNotice('Unable to generate replies. Please try again.');
      setTimeout(() => setNotice(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveToPhrasebook = (item) => {
    storageService.addPhrase({
      english: incomingMessage,
      hindi: item.reply,
      telugu: 'సందేశం',
      category: 'Common Replies',
      tone: item.tone,
      isFavorite: true,
      userNote: `Reply suggestion for "${incomingMessage}"`
    });
    setNotice('Saved reply to My Phrasebook!');
    setTimeout(() => setNotice(''), 2500);
  };

  const handleStartEdit = (idx, currentReply) => {
    setEditingIndex(idx);
    setEditedText(currentReply);
  };

  const handleSaveEdit = (idx) => {
    const updated = [...suggestions];
    updated[idx].reply = editedText;
    setSuggestions(updated);
    setEditingIndex(null);
    setNotice('Updated reply candidate.');
    setTimeout(() => setNotice(''), 2000);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Reply size={24} color="var(--accent-primary)" />
          <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Help Me Reply</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
          Paste an incoming WhatsApp message. Hindi Assist analyzes the context and crafts smart, natural responses across multiple tones.
        </p>
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

      {/* Input Card */}
      <div className="glass-card" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Incoming Message to Reply To:
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setShowContext(!showContext)}
              className="btn-secondary"
              style={{ padding: '4px 8px', fontSize: '0.78rem' }}
            >
              {showContext ? 'Hide Context' : '+ Context'}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Language:</span>
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem'
                }}
              >
                <option value="hi">Hindi (हिन्दी)</option>
                <option value="en">English</option>
                <option value="te">Telugu (తెలుగు)</option>
              </select>
            </div>
          </div>
        </div>

        {showContext && (
          <div style={{ marginBottom: '10px' }}>
            <input
              type="text"
              className="input-field"
              placeholder="Optional conversation context (e.g. Talking to my manager about tomorrow's schedule)..."
              value={replyContext}
              onChange={(e) => setReplyContext(e.target.value)}
              style={{ fontSize: '0.85rem', padding: '8px 12px' }}
            />
          </div>
        )}

        <textarea
          rows={3}
          value={incomingMessage}
          onChange={(e) => setIncomingMessage(e.target.value)}
          placeholder="Paste or type any incoming message here..."
          style={{
            width: '100%',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
            fontSize: '1rem',
            color: 'var(--text-primary)',
            outline: 'none',
            resize: 'none',
            marginBottom: '12px'
          }}
        />

        {/* Quick sample pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Try samples:</span>
          {sampleMessages.map((sm, idx) => (
            <button
              key={idx}
              onClick={() => {
                setIncomingMessage(sm);
                handleGenerateReplies(sm);
              }}
              style={{
                background: 'var(--bg-tertiary)',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                padding: '4px 10px',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              {sm}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => handleGenerateReplies()}
            disabled={isLoading || !incomingMessage.trim()}
            className="btn-primary"
            style={{ padding: '10px 24px' }}
          >
            <Sparkles size={16} />
            <span>{isLoading ? 'Generating Natural Replies...' : 'Generate Smart Replies'}</span>
          </button>
        </div>
      </div>

      {/* Suggested Replies Grid */}
      <h3 style={{ fontSize: '1.15rem', marginBottom: '14px' }}>
        Suggested Replies ({suggestions.length})
      </h3>

      {suggestions.length === 0 && !isLoading && (
        <div className="glass-card" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Enter or paste an incoming message above and click "Generate Smart Replies" to view tailored responses.
        </div>
      )}

      {isLoading && (
        <div className="glass-card" style={{ padding: '30px', textAlign: 'center', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <Sparkles size={20} className="spin" />
          <span>Synthesizing natural Indian conversational replies...</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '16px' }}>
        {suggestions.map((item, idx) => (
          <div
            key={idx}
            className="glass-card"
            style={{
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              border: item.tone === 'Casual' ? '1.5px solid var(--border-focus)' : '1px solid var(--border-subtle)'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span className="badge-pill" style={{
                  background: item.tone === 'Polite' ? 'rgba(16, 185, 129, 0.15)' : 'var(--badge-bg)',
                  color: item.tone === 'Polite' ? '#10b981' : 'var(--badge-text)',
                  fontSize: '0.75rem'
                }}>
                  {item.tone}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {item.label}
                </span>
              </div>

              {editingIndex === idx ? (
                <div>
                  <textarea
                    rows={2}
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-focus)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px',
                      fontSize: '0.95rem',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      marginBottom: '8px'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => setEditingIndex(null)}
                      className="btn-secondary"
                      style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveEdit(idx)}
                      className="btn-primary"
                      style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px', lineHeight: 1.5 }}>
                  "{item.reply}"
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
              <button
                onClick={() => handleStartEdit(idx, item.reply)}
                className="btn-secondary"
                style={{ padding: '4px 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Edit3 size={12} />
                <span>Edit</span>
              </button>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => handleSaveToPhrasebook(item)}
                  className="btn-secondary"
                  style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                  title="Save to My Phrasebook"
                >
                  <Bookmark size={13} />
                </button>
                <button
                  onClick={() => handleCopy(item.reply, idx)}
                  className="btn-primary"
                  style={{ padding: '4px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  {copiedId === idx ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedId === idx ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
