import React, { useState } from 'react';
import { Copy, Check, ArrowRightLeft, Bookmark, Sparkles, MessageSquare, Info, ShieldCheck, AlertCircle } from 'lucide-react';
import { translationClient } from '../services/translationClient';
import { storageService } from '../services/storageService';

export default function TranslatePage({ settings, backendHealth }) {
  const [sourceText, setSourceText] = useState('');
  const [contextMessage, setContextMessage] = useState('');
  const [showContextInput, setShowContextInput] = useState(false);
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('hi');
  const [tone, setTone] = useState('Casual');
  const [mode, setMode] = useState('natural');

  const isGeminiReady = backendHealth?.orchestrator?.geminiAvailable === true;
  const isCloudActive = Boolean(settings?.cloudAiEnabled && isGeminiReady);

  const [translatedText, setTranslatedText] = useState('');
  const [detectedLang, setDetectedLang] = useState('en');
  const [processingSource, setProcessingSource] = useState(isCloudActive ? 'Cloud AI' : 'On-device');
  const [alternatives, setAlternatives] = useState([]);
  const [grammarBreakdown, setGrammarBreakdown] = useState(null);
  const [explanation, setExplanation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedStatus, setCopiedStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isEditable, setIsEditable] = useState(false);

  React.useEffect(() => {
    if (!translatedText) {
      setProcessingSource(isCloudActive ? 'Cloud AI' : 'On-device');
    }
  }, [isCloudActive, translatedText]);

  const swapLanguages = () => {
    const tempSrc = sourceLang === 'auto' ? (detectedLang || 'en') : sourceLang;
    setSourceLang(targetLang);
    setTargetLang(tempSrc);
    if (translatedText) {
      const oldSource = sourceText;
      setSourceText(translatedText);
      setTranslatedText(oldSource);
    }
  };

  const handleTranslate = async () => {
    if (!sourceText.trim() || isLoading) return;
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await translationClient.translate({
        text: sourceText.trim(),
        contextMessage: showContextInput ? contextMessage.trim() : '',
        context: showContextInput ? contextMessage.trim() : '',
        sourceLang,
        targetLang,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
        tone,
        mode,
        style: mode,
        consentCloud: settings?.cloudAiEnabled
      });

      // Actual provider strictly set from the real backend response
      const actualBadge = (res?.provider === 'gemini' || res?.mode === 'cloud' || (res?.processingSource && res.processingSource.toLowerCase().includes('cloud')))
        ? 'Cloud AI'
        : 'On-device';
      setProcessingSource(actualBadge);

      if (res && res.success !== false && res.translation) {
        const tr = res.translation || res.translatedText || '';
        setTranslatedText(tr);
        setDetectedLang(res.detectedLanguage || sourceLang);
        setAlternatives(res.alternatives && res.alternatives.length > 0 ? res.alternatives : [tr]);
        
        const gMap = res.grammarBreakdown || (Array.isArray(res.grammar) && res.grammar.length > 0 
          ? Object.fromEntries(res.grammar.map(g => [g.source, g.target])) 
          : null);
        setGrammarBreakdown(gMap);
        setExplanation(res.nuance || res.explanation || '');

        if (settings?.historyEnabled && tr) {
          storageService.addHistoryItem({
            originalText: sourceText.trim(),
            translatedText: tr,
            sourceLang,
            targetLang,
            direction: `${sourceLang.toUpperCase()} → ${targetLang.toUpperCase()}`,
            translationMode: actualBadge
          });
        }
      } else {
        setTranslatedText('');
        setAlternatives([]);
        setGrammarBreakdown(null);
        setExplanation('');
        setErrorMessage(res?.message || res?.error || 'The on-device offline engine cannot confidently translate this sentence. Please configure GEMINI_API_KEY in backend/.env to enable Cloud AI translation.');
      }
    } catch {
      setErrorMessage('A network error occurred while connecting to the translation engine. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedStatus('Copied to clipboard!');
    setTimeout(() => setCopiedStatus(''), 2000);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard?.readText();
      if (text) setSourceText(text);
    } catch {}
  };

  const handleSaveToPhrasebook = () => {
    if (!translatedText) return;
    storageService.addPhrase({
      english: sourceLang === 'en' ? sourceText : translatedText,
      hindi: targetLang === 'hi' ? translatedText : sourceText,
      telugu: targetLang === 'te' ? translatedText : 'తెలుగు',
      category: 'Saved from Workspace',
      tone,
      isFavorite: true,
      userNote: 'Saved from Translation Workspace'
    });
    setCopiedStatus('Saved to Phrasebook!');
    setTimeout(() => setCopiedStatus(''), 2000);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Translation Workspace</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
            High-accuracy conversational translation for English, Hindi, and Telugu with Indian conversational nuances.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className={`badge-pill ${processingSource === 'Cloud AI' ? 'badge-cloud' : 'badge-on-device'}`}>
            {processingSource === 'Cloud AI' ? <><Sparkles size={12} /> Cloud AI</> : 'On-device'}
          </span>
          <button
            onClick={() => setShowContextInput(!showContextInput)}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.82rem' }}
          >
            {showContextInput ? 'Hide Context Message' : '+ Multi-Message Context'}
          </button>
        </div>
      </div>

      {/* Cloud AI Notice when API key is missing - Never pretend Cloud AI is active */}
      {settings?.cloudAiEnabled && backendHealth && !backendHealth.orchestrator?.geminiAvailable && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          color: '#d97706',
          padding: '10px 16px',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.86rem'
        }}>
          <AlertCircle size={16} />
          <span>
            <strong>Cloud AI Notice:</strong> <code>GEMINI_API_KEY</code> is not configured in <code>backend/.env</code>. Operating in <strong>On-device</strong> local mode.
          </span>
        </div>
      )}

      {copiedStatus && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          color: '#10b981',
          padding: '8px 16px',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '16px',
          fontWeight: 600,
          fontSize: '0.88rem'
        }}>
          ✓ {copiedStatus}
        </div>
      )}

      {errorMessage && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#ef4444',
          padding: '10px 16px',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.88rem'
        }}>
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Multi-Message Context Drawer */}
      {showContextInput && (
        <div className="glass-card animate-fade-in" style={{ padding: '14px 18px', marginBottom: '16px', background: 'var(--bg-tertiary)' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Message 1 (Previous WhatsApp Context):
          </div>
          <input
            type="text"
            className="input-field"
            placeholder="e.g., We have a meeting tomorrow at 10 AM..."
            value={contextMessage}
            onChange={(e) => setContextMessage(e.target.value)}
            style={{ fontSize: '0.88rem', padding: '8px 12px' }}
          />
        </div>
      )}

      {/* Language & Tone Controls */}
      <div className="glass-card" style={{ padding: '12px 18px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <select
            value={sourceLang}
            onChange={(e) => setSourceLang(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontWeight: 600 }}
          >
            <option value="auto">Auto Detect</option>
            <option value="en">English (EN)</option>
            <option value="hi">Hindi (HI)</option>
            <option value="te">Telugu (TE)</option>
          </select>

          <button
            onClick={swapLanguages}
            className="btn-icon"
            title="Swap Languages"
            style={{ background: 'var(--bg-tertiary)', borderRadius: '50%', padding: '8px' }}
          >
            <ArrowRightLeft size={16} />
          </button>

          <select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontWeight: 600 }}
          >
            <option value="hi">Hindi (HI)</option>
            <option value="en">English (EN)</option>
            <option value="te">Telugu (TE)</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tone:</span>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.82rem' }}
            >
              <option value="Casual">Casual (Default)</option>
              <option value="Friendly">Friendly</option>
              <option value="Neutral">Neutral</option>
              <option value="Polite">Polite</option>
              <option value="Formal">Formal</option>
              <option value="Work">Work</option>
            </select>
          </div>

          <div style={{ display: 'flex', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', padding: '2px' }}>
            <button
              onClick={() => setMode('natural')}
              style={{
                padding: '4px 10px',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                background: mode === 'natural' ? 'var(--accent-primary)' : 'transparent',
                color: mode === 'natural' ? '#fff' : 'var(--text-secondary)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Natural
            </button>
            <button
              onClick={() => setMode('literal')}
              style={{
                padding: '4px 10px',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                background: mode === 'literal' ? 'var(--accent-primary)' : 'transparent',
                color: mode === 'literal' ? '#fff' : 'var(--text-secondary)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Literal
            </button>
          </div>
        </div>
      </div>

      {/* Dual Cards: Source & Translation Result */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        
        {/* Source Text Card */}
        <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Source Input ({sourceLang.toUpperCase()})
            </span>
            <button
              onClick={handlePaste}
              className="btn-secondary"
              style={{ padding: '4px 10px', fontSize: '0.78rem' }}
            >
              📋 Paste
            </button>
          </div>

          <textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="Type or paste any sentence to translate..."
            rows={5}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '1.05rem',
              color: 'var(--text-primary)',
              resize: 'none',
              lineHeight: 1.6
            }}
          />

          <div style={{ marginTop: 'auto', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {sourceText.length} characters
            </span>
            <button
              onClick={handleTranslate}
              disabled={isLoading || !sourceText.trim()}
              className="btn-primary"
              style={{ padding: '8px 22px', minWidth: '110px' }}
            >
              {isLoading ? 'Translating...' : 'Translate'}
            </button>
          </div>
        </div>

        {/* Translation Result Card */}
        <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', border: '1.5px solid var(--border-focus)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
                Translation Result ({targetLang.toUpperCase()})
              </span>
              <span className="badge-pill badge-on-device" style={{ fontSize: '0.7rem' }}>
                {mode === 'natural' ? 'Natural' : 'Literal'}
              </span>
              <span className={`badge-pill ${processingSource === 'Cloud AI' ? 'badge-cloud' : 'badge-on-device'}`} style={{ fontSize: '0.7rem' }}>
                {processingSource === 'Cloud AI' ? <><Sparkles size={11} /> Cloud AI</> : 'On-device'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setIsEditable(!isEditable)}
                disabled={!translatedText}
                className="btn-secondary"
                style={{ padding: '4px 8px', fontSize: '0.75rem', opacity: translatedText ? 1 : 0.6 }}
              >
                {isEditable ? 'Lock Edit' : 'Edit'}
              </button>
              <button
                onClick={() => handleCopy(translatedText)}
                disabled={!translatedText}
                className="btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', opacity: translatedText ? 1 : 0.6 }}
              >
                <Copy size={13} />
                <span>Copy</span>
              </button>
              <button
                onClick={handleSaveToPhrasebook}
                disabled={!translatedText}
                className="btn-secondary"
                style={{ padding: '4px 8px', fontSize: '0.75rem', opacity: translatedText ? 1 : 0.6 }}
                title="Save to Phrasebook"
              >
                <Bookmark size={13} />
              </button>
            </div>
          </div>

          {isEditable ? (
            <textarea
              value={translatedText}
              onChange={(e) => setTranslatedText(e.target.value)}
              rows={5}
              style={{
                width: '100%',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-focus)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px',
                fontSize: '1.1rem',
                color: 'var(--text-primary)',
                resize: 'none',
                lineHeight: 1.6
              }}
            />
          ) : (
            <div style={{ fontSize: '1.15rem', fontWeight: 600, color: translatedText ? 'var(--text-primary)' : 'var(--text-muted)', minHeight: '120px', lineHeight: 1.6 }}>
              {isLoading ? (
                <div style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} />
                  <span>Synthesizing natural translation...</span>
                </div>
              ) : (
                translatedText || 'Enter text above and tap Translate to generate natural translation.'
              )}
            </div>
          )}

          {/* Alternative Translations */}
          {alternatives && alternatives.length > 1 && (
            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Natural Alternatives:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {alternatives.map((alt, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'var(--bg-tertiary)',
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem'
                    }}
                  >
                    <span>{alt}</span>
                    <button
                      onClick={() => handleCopy(alt)}
                      className="btn-icon"
                      style={{ padding: '2px 6px' }}
                      title="Copy this alternative"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grammar Breakdown & Nuance Accordion */}
      {grammarBreakdown && Object.keys(grammarBreakdown).length > 0 && (
        <div className="glass-card animate-fade-in" style={{ padding: '18px 24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <Info size={18} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Why this translation? (Conversational Grammar Breakdown)</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '10px' }}>
            {Object.entries(grammarBreakdown).map(([k, v]) => (
              <div key={k} style={{ background: 'var(--bg-tertiary)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Token</span>
                <strong>{k}</strong> → <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>

          {explanation && (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'rgba(79, 70, 229, 0.08)', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}>
              💡 <strong>Nuance Note:</strong> {explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
