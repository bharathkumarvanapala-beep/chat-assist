import React, { useState } from 'react';
import { Send, Copy, Bookmark, BookA, Info, Check, Sparkles, MessageCircle, RefreshCw } from 'lucide-react';
import { translationClient } from '../services/translationClient';
import { storageService } from '../services/storageService';

export default function ChatAssistantPage({ settings }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: 'Namaste! I am Hindi Assist, your privacy-first multilingual communication and learning partner. Paste any message or type naturally in English, Hindi, or Telugu.',
      translation: 'नमस्ते! मैं हिन्दी असिस्ट हूँ, आपका व्यक्तिगत अनुवाद एवं भाषा साथी।',
      direction: 'EN → HI',
      tone: 'Casual',
      time: '10:00 AM'
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [direction, setDirection] = useState('en-hi');
  const [tone, setTone] = useState('Casual');
  const [translationMode, setTranslationMode] = useState('natural'); // natural vs literal
  const [isLoading, setIsLoading] = useState(false);
  const [expandedExplanationId, setExpandedExplanationId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [feedbackNotice, setFeedbackNotice] = useState('');

  const directions = [
    { id: 'en-hi', label: 'English → Hindi', src: 'en', tgt: 'hi' },
    { id: 'hi-en', label: 'Hindi → English', src: 'hi', tgt: 'en' },
    { id: 'te-hi', label: 'Telugu → Hindi', src: 'te', tgt: 'hi' },
    { id: 'hi-te', label: 'Hindi → Telugu', src: 'hi', tgt: 'te' },
    { id: 'auto-hi', label: 'Auto Detect → Hindi', src: 'auto', tgt: 'hi' }
  ];

  const tones = ['Casual', 'Friendly', 'Neutral', 'Polite', 'Formal', 'Work'];

  const handleSendMessage = async (textToSend = inputText) => {
    const text = textToSend.trim();
    if (!text) return;

    const currentDir = directions.find(d => d.id === direction) || directions[0];
    setIsLoading(true);
    setInputText('');

    // Add user bubble
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);

    // Send through AI Assistant (Orchestrator)
    const res = await translationClient.sendChatMessage({
      query: text,
      dialogueHistory: messages.slice(-6).map(m => ({ sender: m.sender, text: m.text })),
      targetLanguage: currentDir.tgt,
      tone
    });

    const isDirectTranslation = Boolean(res.translation);
    const mainDisplayText = isDirectTranslation ? res.translation : (res.reply || text);

    const assistantMsg = {
      id: Date.now() + 1,
      sender: 'assistant',
      original: isDirectTranslation ? text : null,
      text: mainDisplayText,
      sourceLang: currentDir.src,
      targetLang: currentDir.tgt,
      direction: `${currentDir.src.toUpperCase()} → ${currentDir.tgt.toUpperCase()}`,
      tone,
      mode: translationMode,
      processingSource: res.processingSource || (res.provider === 'gemini' ? '✨ Gemini AI' : '📱 On-device'),
      alternatives: res.alternatives || [],
      grammarBreakdown: res.grammarBreakdown || (Array.isArray(res.grammar) && res.grammar.length > 0 ? Object.fromEntries(res.grammar.map(g => [g.source, g.target])) : null),
      explanation: res.grammarNotes || res.nuance || res.explanation || (isDirectTranslation ? '' : res.reply),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, assistantMsg]);
    setIsLoading(false);

    // Save to local history if enabled
    if (settings.historyEnabled && isDirectTranslation) {
      storageService.addHistoryItem({
        originalText: text,
        translatedText: mainDisplayText,
        sourceLang: currentDir.src,
        targetLang: currentDir.tgt,
        direction: assistantMsg.direction,
        translationMode: assistantMsg.processingSource
      });
    }
  };

  const handlePasteWhatsApp = async () => {
    try {
      const clipText = await navigator.clipboard?.readText();
      if (clipText) {
        setInputText(clipText);
        setFeedbackNotice('Pasted from clipboard!');
        setTimeout(() => setFeedbackNotice(''), 2000);
      } else {
        setFeedbackNotice('Clipboard is empty.');
        setTimeout(() => setFeedbackNotice(''), 2000);
      }
    } catch {
      setFeedbackNotice('Long-press the input field and select Paste.');
      setTimeout(() => setFeedbackNotice(''), 3000);
    }
  };

  const handleCopyText = (text, id) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveToPhrasebook = (msg) => {
    storageService.addPhrase({
      english: msg.sourceLang === 'en' ? msg.original : msg.text,
      hindi: msg.targetLang === 'hi' ? msg.text : msg.original,
      telugu: msg.targetLang === 'te' ? msg.text : 'తెలుగు',
      category: 'Saved from Chat',
      tone: msg.tone,
      isFavorite: true,
      userNote: `Captured from chat session (${msg.direction})`
    });
    setFeedbackNotice('Saved to My Phrasebook!');
    setTimeout(() => setFeedbackNotice(''), 2500);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      {/* Top Controls Bar */}
      <div className="glass-card" style={{ padding: '12px 18px', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Direction Selector */}
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontWeight: 600,
              fontSize: '0.85rem'
            }}
          >
            {directions.map(d => (
              <option key={d.id} value={d.id}>{d.label}</option>
            ))}
          </select>

          {/* Tone Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Tone:</span>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '0.82rem'
              }}
            >
              {tones.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Natural vs Literal Toggle */}
          <div style={{ display: 'flex', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', padding: '2px' }}>
            <button
              onClick={() => setTranslationMode('natural')}
              style={{
                padding: '4px 10px',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                background: translationMode === 'natural' ? 'var(--accent-primary)' : 'transparent',
                color: translationMode === 'natural' ? '#fff' : 'var(--text-secondary)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Natural
            </button>
            <button
              onClick={() => setTranslationMode('literal')}
              style={{
                padding: '4px 10px',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                background: translationMode === 'literal' ? 'var(--accent-primary)' : 'transparent',
                color: translationMode === 'literal' ? '#fff' : 'var(--text-secondary)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Literal
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handlePasteWhatsApp}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Paste copied WhatsApp message from clipboard"
          >
            <span>📋 Paste WhatsApp</span>
          </button>
        </div>
      </div>

      {feedbackNotice && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          color: '#10b981',
          padding: '8px 16px',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '10px',
          fontSize: '0.85rem',
          fontWeight: 600
        }}>
          ✓ {feedbackNotice}
        </div>
      )}

      {/* Messages Scroll Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)'
      }}>
        {messages.map(msg => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <div style={{
              maxWidth: '82%',
              background: msg.sender === 'user' ? 'var(--accent-gradient)' : 'var(--surface-card)',
              color: msg.sender === 'user' ? '#ffffff' : 'var(--text-primary)',
              borderRadius: msg.sender === 'user' ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
              padding: '14px 18px',
              border: msg.sender === 'user' ? 'none' : '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              {/* Header Label for Assistant */}
              {msg.sender === 'assistant' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--accent-primary)' }}>HINDI ASSIST</span>
                    <span className="badge-pill badge-on-device" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                      {msg.processingSource || '📱 On-device'}
                    </span>
                  </div>
                  {msg.direction && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {msg.direction} • {msg.tone}
                    </span>
                  )}
                </div>
              )}

              {/* Main Message Text */}
              <div style={{ fontSize: '1.02rem', lineHeight: 1.5, fontWeight: msg.sender === 'assistant' ? 600 : 400 }}>
                {msg.text}
              </div>

              {/* Original input reference for assistant */}
              {msg.original && (
                <div style={{
                  marginTop: '8px',
                  paddingTop: '6px',
                  borderTop: '1px solid var(--border-subtle)',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)'
                }}>
                  Original: "{msg.original}"
                </div>
              )}

              {/* Alternative translations */}
              {msg.alternatives && msg.alternatives.length > 1 && (
                <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Natural Alternatives:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {msg.alternatives.map((alt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleCopyText(alt, `alt-${msg.id}-${idx}`)}
                        className="btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <span>{alt}</span>
                        {copiedId === `alt-${msg.id}-${idx}` ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Grammar / Explanation Expandable Card */}
              {msg.grammarBreakdown && (
                <div style={{ marginTop: '10px' }}>
                  <button
                    onClick={() => setExpandedExplanationId(expandedExplanationId === msg.id ? null : msg.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-primary)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: 0
                    }}
                  >
                    <Info size={13} />
                    <span>{expandedExplanationId === msg.id ? 'Hide grammar explanation' : 'Why this translation?'}</span>
                  </button>

                  {expandedExplanationId === msg.id && (
                    <div style={{
                      marginTop: '6px',
                      background: 'var(--bg-tertiary)',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.82rem'
                    }}>
                      <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                        Grammar Breakdown:
                      </div>
                      {Object.entries(msg.grammarBreakdown).map(([k, v]) => (
                        <div key={k} style={{ color: 'var(--text-secondary)' }}>
                          <strong>{k}</strong> → {v}
                        </div>
                      ))}
                      {msg.explanation && (
                        <div style={{ marginTop: '6px', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                          💡 {msg.explanation}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Actions Footer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px', gap: '8px' }}>
                <span style={{ fontSize: '0.68rem', opacity: 0.7 }}>
                  {msg.time}
                </span>

                {msg.sender === 'assistant' && (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => handleCopyText(msg.text, msg.id)}
                      className="btn-icon"
                      style={{ padding: '4px 6px' }}
                      title="Copy translated text"
                    >
                      {copiedId === msg.id ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    </button>
                    <button
                      onClick={() => handleSaveToPhrasebook(msg)}
                      className="btn-icon"
                      style={{ padding: '4px 6px' }}
                      title="Save to My Phrasebook"
                    >
                      <Bookmark size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div style={{ alignSelf: 'flex-start', background: 'var(--surface-card)', padding: '10px 16px', borderRadius: '16px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={14} className="pulsing-indicator" />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Synthesizing natural translation...</span>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div style={{ marginTop: '12px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <input
          type="text"
          className="input-field"
          placeholder="Type or paste message (e.g. 'Are you free now?' / 'क्या तुम कल आओगे?')..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
          style={{ height: '48px' }}
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={!inputText.trim() || isLoading}
          className="btn-primary"
          style={{ height: '48px', padding: '0 22px', flexShrink: 0 }}
        >
          <span>Send</span>
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
