import React, { useState } from 'react';
import { Send, Copy, ArrowRight, ShieldCheck, Lock, Smartphone, RefreshCw } from 'lucide-react';
import { translationClient } from '../services/translationClient';
import { transliterationService } from '../services/transliterationService';

export default function KeyboardSimulator({ settings, theme, setTheme }) {
  // WhatsApp Simulated State
  const [messages, setMessages] = useState([
    { id: 1, sender: 'friend', text: 'Bro kal meeting hai क्या? At 10 AM?', time: '10:14 AM' },
    { id: 2, sender: 'friend', text: 'Why didn\'t you come yesterday?', time: '10:15 AM' }
  ]);
  const [whatsappInputField, setWhatsappInputField] = useState('');

  // Hindi Assist Keyboard State
  const [activeDirection, setActiveDirection] = useState('HI → EN');
  const [tone, setTone] = useState('Casual');
  const [typedBuffer, setTypedBuffer] = useState('');
  const [keyboardTranslation, setKeyboardTranslation] = useState('');
  const [clipboardBuffer, setClipboardBuffer] = useState('Why didn\'t you come yesterday?');
  const [isSensitiveField, setIsSensitiveField] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState('');

  const directions = [
    { label: 'EN → HI', src: 'en', tgt: 'hi' },
    { label: 'HI → EN', src: 'hi', tgt: 'en' },
    { label: 'TE → HI', src: 'te', tgt: 'hi' },
    { label: 'HI → TE', src: 'hi', tgt: 'te' },
    { label: 'AUTO', src: 'auto', tgt: 'hi' }
  ];

  const handleTranslateClipboard = async () => {
    if (isSensitiveField) return;
    if (!clipboardBuffer) {
      setKeyboardTranslation('Clipboard is empty.');
      return;
    }
    setIsTranslating(true);
    const active = directions.find(d => d.label === activeDirection) || directions[1];
    const res = await translationClient.translate({
      text: clipboardBuffer,
      sourceLang: active.src,
      targetLang: active.tgt,
      tone
    });
    setKeyboardTranslation(res.translatedText);
    setIsTranslating(false);
  };

  const handleTranslateTyped = async () => {
    if (isSensitiveField || !typedBuffer.trim()) return;
    setIsTranslating(true);
    const active = directions.find(d => d.label === activeDirection) || directions[1];
    let textToTranslate = typedBuffer.trim();
    if (active.src === 'hi' && transliterationService.isRomanHindi(textToTranslate)) {
      const transliterated = transliterationService.transliterateSentence(textToTranslate).primary;
      if (transliterated) {
        textToTranslate = transliterated;
        setTypedBuffer(transliterated);
      }
    }
    const res = await translationClient.translate({
      text: textToTranslate,
      sourceLang: active.src,
      targetLang: active.tgt,
      tone
    });
    setKeyboardTranslation(res.translatedText || res.translation);
    setIsTranslating(false);
  };

  const handleInsert = () => {
    if (isSensitiveField || !keyboardTranslation) return;
    // Commits text safely into simulated WhatsApp input field
    setWhatsappInputField(prev => prev ? `${prev} ${keyboardTranslation}` : keyboardTranslation);
    setCopiedNotification('Inserted into WhatsApp field!');
    setTimeout(() => setCopiedNotification(''), 2500);
  };

  const handleCopy = () => {
    if (!keyboardTranslation) return;
    navigator.clipboard?.writeText(keyboardTranslation);
    setCopiedNotification('Copied to clipboard!');
    setTimeout(() => setCopiedNotification(''), 2500);
  };

  const handleSendWhatsApp = () => {
    if (!whatsappInputField.trim()) return;
    const newMsg = {
      id: Date.now(),
      sender: 'me',
      text: whatsappInputField,
      time: 'Just now'
    };
    setMessages(prev => [...prev, newMsg]);
    setWhatsappInputField('');
  };

  const handleCopyIncomingMessage = (text) => {
    setClipboardBuffer(text);
    navigator.clipboard?.writeText(text);
    setCopiedNotification(`Copied to clipboard: "${text}"`);
    setTimeout(() => setCopiedNotification(''), 2500);
  };

  return (
    <div className="glass-card animate-fade-in" style={{ padding: '28px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Smartphone size={24} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Android Translation Keyboard Simulator</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
            Test the live InputMethodService toolbar workflow directly inside a simulated WhatsApp chat.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer', background: 'var(--bg-tertiary)', padding: '6px 12px', borderRadius: 'var(--radius-sm)' }}>
            <input
              type="checkbox"
              checked={isSensitiveField}
              onChange={(e) => setIsSensitiveField(e.target.checked)}
            />
            <span>Simulate Password Field</span>
          </label>
        </div>
      </div>

      {copiedNotification && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          color: '#10b981',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          padding: '8px 16px',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '16px',
          fontSize: '0.88rem',
          fontWeight: 600
        }}>
          ✓ {copiedNotification}
        </div>
      )}

      {/* Simulated Device Screen */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '24px',
        background: 'var(--bg-primary)',
        border: '2px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        boxShadow: 'var(--shadow-md)'
      }}>

        {/* 1. Simulated WhatsApp Conversation */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          height: '280px',
          overflow: 'hidden'
        }}>
          {/* WhatsApp Header */}
          <div style={{
            background: 'var(--bg-tertiary)',
            padding: '10px 16px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '0.85rem' }}>
                B
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Bharath (WhatsApp)</div>
                <div style={{ fontSize: '0.72rem', color: '#10b981' }}>online</div>
              </div>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tap message to copy</span>
          </div>

          {/* Messages Feed */}
          <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.map(m => (
              <div
                key={m.id}
                style={{
                  alignSelf: m.sender === 'me' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  background: m.sender === 'me' ? 'var(--accent-gradient)' : 'var(--bg-tertiary)',
                  color: m.sender === 'me' ? '#fff' : 'var(--text-primary)',
                  padding: '9px 14px',
                  borderRadius: m.sender === 'me' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  fontSize: '0.88rem',
                  boxShadow: 'var(--shadow-sm)',
                  position: 'relative',
                  cursor: m.sender === 'friend' ? 'pointer' : 'default'
                }}
                onClick={() => m.sender === 'friend' && handleCopyIncomingMessage(m.text)}
                title={m.sender === 'friend' ? 'Click to copy text into clipboard buffer' : ''}
              >
                <div>{m.text}</div>
                <div style={{ fontSize: '0.68rem', opacity: 0.7, textAlign: 'right', marginTop: '4px' }}>
                  {m.time} {m.sender === 'friend' && '• (Tap to copy)'}
                </div>
              </div>
            ))}
          </div>

          {/* WhatsApp Bottom Input Row with manual Send Button */}
          <div style={{
            padding: '10px 14px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-tertiary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <input
              type={isSensitiveField ? "password" : "text"}
              placeholder={isSensitiveField ? "Password field (protected)..." : "Type or Insert translated message..."}
              value={whatsappInputField}
              onChange={(e) => setWhatsappInputField(e.target.value)}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '0.88rem',
                outline: 'none'
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSendWhatsApp()}
            />
            <button
              onClick={handleSendWhatsApp}
              className="btn-primary"
              style={{
                borderRadius: 'var(--radius-full)',
                padding: '10px 16px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Manual WhatsApp Send Button (Hindi Assist NEVER auto-sends messages)"
            >
              <span>Send</span>
              <Send size={15} />
            </button>
          </div>
        </div>

        {/* 2. Real Hindi Assist Keyboard Toolbar Interface */}
        <div style={{
          background: 'var(--surface-card)',
          border: '1.5px solid var(--border-focus)',
          borderRadius: 'var(--radius-md)',
          padding: '14px',
          boxShadow: 'var(--shadow-glow)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
              ⌨ Hindi Assist Keyboard Toolbar
            </span>
            <span className="badge-pill badge-on-device" style={{ fontSize: '0.72rem' }}>
              📱 On-device • Zero Keystroke Logging
            </span>
          </div>

          {/* Keyboard Toolbar Row */}
          <div style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            paddingBottom: '8px',
            marginBottom: '10px'
          }}>
            {directions.map(d => (
              <button
                key={d.label}
                onClick={() => setActiveDirection(d.label)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: activeDirection === d.label ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  background: activeDirection === d.label ? 'var(--accent-gradient)' : 'var(--bg-tertiary)',
                  color: activeDirection === d.label ? '#fff' : 'var(--text-primary)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                [{d.label}]
              </button>
            ))}

            <button
              onClick={handleTranslateClipboard}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.78rem', whiteSpace: 'nowrap', fontWeight: 600 }}
              title="Read clipboard and translate instantly"
            >
              📋 Clipboard
            </button>

            <button
              onClick={handleTranslateTyped}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.78rem', whiteSpace: 'nowrap', fontWeight: 600 }}
            >
              Translate
            </button>

            <button
              onClick={handleInsert}
              disabled={!keyboardTranslation || isSensitiveField}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: keyboardTranslation && !isSensitiveField ? '#10b981' : 'var(--bg-tertiary)',
                color: keyboardTranslation && !isSensitiveField ? '#fff' : 'var(--text-muted)',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: keyboardTranslation ? 'pointer' : 'not-allowed',
                whiteSpace: 'nowrap'
              }}
            >
              Insert ↵
            </button>

            <button
              onClick={handleCopy}
              disabled={!keyboardTranslation}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
            >
              Copy
            </button>
          </div>

          {/* Sensitive Guard Warning */}
          {isSensitiveField ? (
            <div style={{
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#ef4444',
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Lock size={16} />
              <span>Password/Sensitive input field detected. Hindi Assist translation assistant is disabled to protect private credentials.</span>
            </div>
          ) : (
            <>
              {/* Keyboard Assistant Preview Bar */}
              <div style={{
                background: 'var(--bg-tertiary)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                    Translation Candidate ({activeDirection})
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: keyboardTranslation ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {isTranslating ? 'Translating on-device...' : (keyboardTranslation || 'No translation active yet')}
                  </div>
                </div>

                {keyboardTranslation && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={handleInsert} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
                      Insert
                    </button>
                    <button onClick={handleCopy} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.78rem' }}>
                      <Copy size={13} />
                    </button>
                  </div>
                )}
              </div>

              {/* Typing Simulator for Keyboard */}
              {activeDirection.startsWith('HI') && typedBuffer.trim() && transliterationService.isRomanHindi(typedBuffer) && (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>⚡ Transliteration:</span>
                  {transliterationService.transliterateSentence(typedBuffer).all.slice(0, 3).map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setTypedBuffer(sug)}
                      style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '2px 8px',
                        fontSize: '0.78rem',
                        color: 'var(--text-primary)',
                        cursor: 'pointer'
                      }}
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Type Hindi reply here (e.g. kaha jana hai / मैं अभी घर पर हूँ)..."
                  value={typedBuffer}
                  onChange={(e) => setTypedBuffer(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem'
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleTranslateTyped()}
                />
                <button
                  onClick={handleTranslateTyped}
                  className="btn-primary"
                  style={{ padding: '8px 14px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
                >
                  Translate Typed
                </button>
              </div>
            </>
          )}

          {/* Workflow Explanation Banner */}
          <div style={{ marginTop: '12px', fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span><strong>Primary User Workflow:</strong> Copy incoming WhatsApp message</span>
            <ArrowRight size={12} />
            <span>Tap [Clipboard]</span>
            <ArrowRight size={12} />
            <span>Type Hindi reply</span>
            <ArrowRight size={12} />
            <span>Tap [Insert]</span>
            <ArrowRight size={12} />
            <span>User manually clicks WhatsApp Send button</span>
          </div>
        </div>

      </div>
    </div>
  );
}
