import React, { useState } from 'react';
import { Copy, Check, ArrowRightLeft, Bookmark, Sparkles, MessageSquare, Info, ShieldCheck, AlertCircle, Mic, MicOff, Volume2, VolumeX, Radio } from 'lucide-react';
import { translationClient } from '../services/translationClient';
import { storageService } from '../services/storageService';
import { transliterationService } from '../services/transliterationService';
import { voiceService } from '../services/voiceService';
import { idbService } from '../services/db/indexedDbService';

export default function TranslatePage({ settings, onUpdateSettings, backendHealth }) {
  const [sourceText, setSourceText] = useState('');
  const [contextMessage, setContextMessage] = useState('');
  const [showContextInput, setShowContextInput] = useState(false);
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('hi');
  const [tone, setTone] = useState('Casual');
  const [mode, setMode] = useState('natural');
  const [hindiInputMode, setHindiInputMode] = useState('roman'); // 'roman' (Roman Hindi typing assistant) | 'script' (Direct Devanagari Hindi script)

  // Voice Mode & Speech Recognition State
  const [isListening, setIsListening] = useState(false);
  const [voiceStatusMessage, setVoiceStatusMessage] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(false); // Hands-free Voice Mode
  const [autoSpeakTranslation, setAutoSpeakTranslation] = useState(false);
  const [isSpeakingResult, setIsSpeakingResult] = useState(false);

  // Cloud AI state: respects user settings (default enabled unless explicitly set to false)
  const isCloudAiEnabled = settings?.cloudAiEnabled !== false;
  const isGeminiAvailable = backendHealth?.orchestrator?.geminiAvailable === true || backendHealth?.gemini_status === 'ACTIVE';

  const handleToggleCloudAi = () => {
    const nextVal = !isCloudAiEnabled;
    if (onUpdateSettings) {
      onUpdateSettings({ cloudAiEnabled: nextVal });
    }
  };

  const [translatedText, setTranslatedText] = useState('');
  const [detectedLang, setDetectedLang] = useState('en');
  
  // Initial provider status reflects user preference without prematurely assuming Gemini is dead
  const initialSource = isCloudAiEnabled ? (backendHealth && !isGeminiAvailable ? 'On-device' : 'Cloud AI') : 'On-device';
  const [processingSource, setProcessingSource] = useState(initialSource);

  const [alternatives, setAlternatives] = useState([]);
  const [grammarBreakdown, setGrammarBreakdown] = useState(null);
  const [explanation, setExplanation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedStatus, setCopiedStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isEditable, setIsEditable] = useState(false);

  React.useEffect(() => {
    if (!translatedText) {
      const activeSource = isCloudAiEnabled ? (backendHealth && !isGeminiAvailable ? 'On-device' : 'Cloud AI') : 'On-device';
      setProcessingSource(activeSource);
    }
  }, [isCloudAiEnabled, isGeminiAvailable, backendHealth, translatedText]);

  // Clean up speech recognition & synthesis when unmounting
  React.useEffect(() => {
    return () => {
      voiceService.stopListening();
      voiceService.stopSpeaking();
    };
  }, []);

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

  const isHindiSource = sourceLang === 'hi';

  // Compute on-device transliteration suggestions with 0 network calls
  const transliterationResult = React.useMemo(() => {
    if (!isHindiSource || hindiInputMode !== 'roman' || !sourceText.trim()) {
      return { primary: '', alternatives: [], all: [] };
    }
    if (!transliterationService.isRomanHindi(sourceText)) {
      return { primary: '', alternatives: [], all: [] };
    }
    return transliterationService.transliterateSentence(sourceText);
  }, [isHindiSource, hindiInputMode, sourceText]);

  const handleApplyTransliteration = (text) => {
    if (!text) return;
    setSourceText(text);
  };

  const handleSourceKeyDown = (e) => {
    if ((e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey)) && isHindiSource && hindiInputMode === 'roman') {
      if (transliterationResult?.primary && transliterationService.isRomanHindi(sourceText)) {
        e.preventDefault();
        handleApplyTransliteration(transliterationResult.primary);
      }
    }
  };

  const executeTranslation = async (overrideText) => {
    let cleanText = (overrideText !== undefined ? overrideText : sourceText).trim();
    if (!cleanText || isLoading) return;

    // In Roman Hindi mode, auto-transliterate Roman input to Devanagari before translating
    if (isHindiSource && hindiInputMode === 'roman' && transliterationService.isRomanHindi(cleanText)) {
      const transliterated = transliterationService.transliterateSentence(cleanText).primary;
      if (transliterated) {
        cleanText = transliterated;
        setSourceText(transliterated);
      }
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await translationClient.translate({
        text: cleanText,
        contextMessage: showContextInput ? contextMessage.trim() : '',
        context: showContextInput ? contextMessage.trim() : '',
        sourceLang,
        targetLang,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
        tone,
        mode,
        style: mode,
        consentCloud: isCloudAiEnabled
      });

      // Actual provider strictly set from the real backend response
      const isCloudResponse = (res?.provider === 'gemini' || res?.mode === 'cloud' || (res?.processingSource && res.processingSource.toLowerCase().includes('cloud')));
      const actualBadge = isCloudResponse ? 'Cloud AI' : 'On-device';
      setProcessingSource(actualBadge);

      if (res && res.success !== false && (res.translation || res.translatedText)) {
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
            originalText: (overrideText || sourceText).trim(),
            translatedText: tr,
            sourceLang,
            targetLang,
            direction: `${sourceLang.toUpperCase()} → ${targetLang.toUpperCase()}`,
            translationMode: actualBadge
          });
        }

        // Auto-speak translated result if Voice Mode or auto-speak is active
        if ((isVoiceMode || autoSpeakTranslation) && tr) {
          voiceService.speak({
            text: tr,
            lang: targetLang,
            onStart: () => setIsSpeakingResult(true),
            onEnd: () => setIsSpeakingResult(false),
            onError: () => setIsSpeakingResult(false)
          });
        }
      } else {
        setTranslatedText('');
        setAlternatives([]);
        setGrammarBreakdown(null);
        setExplanation('');

        let err = res?.message || res?.error || '';
        if (isGeminiAvailable || isCloudAiEnabled) {
          if (err.includes('GEMINI_API_KEY') || err.includes('configure GEMINI_API_KEY')) {
            err = isCloudAiEnabled
              ? 'Cloud AI translation service is temporarily unavailable. Please try again in a moment.'
              : 'The on-device offline engine cannot confidently translate this sentence. Enable Cloud AI for advanced translation.';
          }
        }
        if (!err) {
          err = isCloudAiEnabled
            ? 'Cloud AI translation is currently unavailable. Please check your connection or try again.'
            : 'The on-device offline engine cannot confidently translate this sentence. Enable Cloud AI for advanced translation.';
        }
        setErrorMessage(err);
      }
    } catch {
      setErrorMessage(isCloudAiEnabled
        ? 'A network error occurred while connecting to the translation engine. Please try again.'
        : 'The on-device offline engine cannot confidently translate this sentence. Enable Cloud AI for advanced translation.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranslate = () => executeTranslation();

  // Voice Input (Speech-to-Text) handler
  const handleToggleVoiceInput = () => {
    if (isListening) {
      voiceService.stopListening();
      setIsListening(false);
      setVoiceStatusMessage('');
      return;
    }

    if (!voiceService.isRecognitionSupported()) {
      setErrorMessage('Voice recognition is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Safari.');
      return;
    }

    setErrorMessage('');
    const langName = sourceLang === 'hi' ? 'Hindi' : (sourceLang === 'te' ? 'Telugu' : 'English');
    setVoiceStatusMessage(`Listening... Speak in ${langName}`);

    voiceService.startListening({
      lang: sourceLang,
      onStart: () => {
        setIsListening(true);
      },
      onResult: ({ transcript, isFinal }) => {
        setSourceText(transcript);
        if (isFinal && transcript.trim()) {
          setVoiceStatusMessage('Recognized speech! Translating now...');
          voiceService.stopListening();
          setIsListening(false);
          // By speaking, translation is immediately done!
          executeTranslation(transcript);
        }
      },
      onError: (err) => {
        setIsListening(false);
        setVoiceStatusMessage('');
        setErrorMessage(err);
      },
      onEnd: () => {
        setIsListening(false);
        setVoiceStatusMessage('');
      }
    });
  };

  // Text-to-Speech playback handler
  const handleSpeakResult = (customText) => {
    const textToSpeak = customText || translatedText;
    if (!textToSpeak) return;

    if (isSpeakingResult) {
      voiceService.stopSpeaking();
      setIsSpeakingResult(false);
      return;
    }

    setIsSpeakingResult(true);
    voiceService.speak({
      text: textToSpeak,
      lang: targetLang,
      onStart: () => setIsSpeakingResult(true),
      onEnd: () => setIsSpeakingResult(false),
      onError: () => setIsSpeakingResult(false)
    });
  };

  // Dedicated Voice Mode toggle (hands-free conversational flow)
  const handleToggleVoiceMode = () => {
    const next = !isVoiceMode;
    setIsVoiceMode(next);
    if (next) {
      setAutoSpeakTranslation(true);
      setCopiedStatus('🎙 Voice Mode ON: Speak to translate automatically with audio playback!');
      setTimeout(() => setCopiedStatus(''), 3000);
      handleToggleVoiceInput();
    } else {
      voiceService.stopListening();
      voiceService.stopSpeaking();
      setIsListening(false);
      setIsSpeakingResult(false);
      setVoiceStatusMessage('');
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
    const phraseObj = {
      english: sourceLang === 'en' ? sourceText : translatedText,
      hindi: targetLang === 'hi' ? translatedText : sourceText,
      telugu: targetLang === 'te' ? translatedText : 'తెలుగు',
      category: 'Saved from Workspace',
      tone,
      isFavorite: true,
      userNote: 'Saved from Translation Workspace'
    };
    storageService.addPhrase(phraseObj);
    idbService.addCustomPhrase(phraseObj).catch(() => {});
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
          {/* Voice Mode Toggle in Header */}
          <button
            type="button"
            onClick={handleToggleVoiceMode}
            className={`badge-pill ${isVoiceMode ? 'badge-cloud' : 'badge-on-device'}`}
            style={{
              cursor: 'pointer',
              border: isVoiceMode ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border-subtle)',
              background: isVoiceMode ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-tertiary)',
              color: isVoiceMode ? '#f59e0b' : 'var(--text-secondary)',
              transition: 'all var(--transition-fast)'
            }}
            title={isVoiceMode ? 'Voice Mode Active: Speak to translate automatically. Click to turn off.' : 'Click to enable hands-free Voice Mode'}
          >
            <Radio size={12} className={isVoiceMode ? 'pulsing-indicator' : ''} color={isVoiceMode ? '#f59e0b' : 'currentColor'} />
            <span>{isVoiceMode ? '🎙 Voice Mode: ON' : '🎙 Voice Mode'}</span>
          </button>

          <button
            type="button"
            onClick={handleToggleCloudAi}
            className={`badge-pill ${processingSource === 'Cloud AI' ? 'badge-cloud' : 'badge-on-device'}`}
            style={{
              cursor: 'pointer',
              border: processingSource === 'Cloud AI' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border-subtle)',
              background: processingSource === 'Cloud AI' ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-tertiary)',
              color: processingSource === 'Cloud AI' ? '#f59e0b' : 'var(--text-secondary)',
              transition: 'all var(--transition-fast)'
            }}
            title={isCloudAiEnabled ? 'Cloud AI active (Click to toggle On-device mode)' : 'Operating On-device (Click to enable Cloud AI)'}
          >
            {processingSource === 'Cloud AI' ? <><Sparkles size={12} /> Cloud AI</> : 'On-device'}
          </button>
          <button
            onClick={() => setShowContextInput(!showContextInput)}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.82rem' }}
          >
            {showContextInput ? 'Hide Context Message' : '+ Multi-Message Context'}
          </button>
        </div>
      </div>

      {/* Cloud AI Notice: only when API key is genuinely missing from backend */}
      {isCloudAiEnabled && backendHealth && backendHealth.status !== 'offline' && backendHealth.gemini_status !== 'ACTIVE' && backendHealth.orchestrator?.geminiAvailable !== true && (
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

          {/* Cloud AI Toggle Switch in Translation Flow */}
          <button
            type="button"
            onClick={handleToggleCloudAi}
            className={`badge-pill ${isCloudAiEnabled ? 'badge-cloud' : 'badge-on-device'}`}
            style={{
              cursor: 'pointer',
              border: isCloudAiEnabled ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border-subtle)',
              background: isCloudAiEnabled ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-tertiary)',
              color: isCloudAiEnabled ? '#f59e0b' : 'var(--text-secondary)',
              fontSize: '0.78rem',
              fontWeight: 600,
              padding: '5px 12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title={isCloudAiEnabled ? 'Cloud AI is enabled: Uses Google Gemini. Click to switch to On-device mode.' : 'Cloud AI is disabled: Operating 100% on-device. Click to enable Cloud AI.'}
          >
            {isCloudAiEnabled ? <><Sparkles size={12} color="#f59e0b" /> Cloud AI: ON</> : 'Cloud AI: OFF'}
          </button>

          {/* Voice Mode Toggle Switch */}
          <button
            type="button"
            onClick={handleToggleVoiceMode}
            className={`badge-pill ${isVoiceMode ? 'badge-cloud' : 'badge-on-device'}`}
            style={{
              cursor: 'pointer',
              border: isVoiceMode ? '1px solid #10b981' : '1px solid var(--border-subtle)',
              background: isVoiceMode ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-tertiary)',
              color: isVoiceMode ? '#10b981' : 'var(--text-secondary)',
              fontSize: '0.78rem',
              fontWeight: 600,
              padding: '5px 12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title={isVoiceMode ? 'Voice Mode Active: Speak to translate automatically. Click to turn off.' : 'Click to enable hands-free Voice Mode'}
          >
            <Radio size={12} className={isVoiceMode ? 'pulsing-indicator' : ''} color={isVoiceMode ? '#10b981' : 'currentColor'} />
            <span>{isVoiceMode ? '🎙 Voice Mode: ON' : '🎙 Voice Mode'}</span>
          </button>
        </div>
      </div>

      {/* Dual Cards: Source & Translation Result */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        
        {/* Source Text Card */}
        <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Source Input ({sourceLang.toUpperCase()})
              </span>
              {isHindiSource && (
                <div style={{ display: 'inline-flex', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', padding: '2px', border: '1px solid var(--border-subtle)' }}>
                  <button
                    type="button"
                    onClick={() => setHindiInputMode('roman')}
                    style={{
                      padding: '2px 8px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      background: hindiInputMode === 'roman' ? 'var(--accent-primary)' : 'transparent',
                      color: hindiInputMode === 'roman' ? '#fff' : 'var(--text-muted)',
                      transition: 'all 0.15s ease'
                    }}
                    title="Type in Roman Hindi (e.g., 'kaha jana hai') with on-device transliteration suggestions"
                  >
                    abc → अ Roman Hindi
                  </button>
                  <button
                    type="button"
                    onClick={() => setHindiInputMode('script')}
                    style={{
                      padding: '2px 8px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      background: hindiInputMode === 'script' ? 'var(--accent-primary)' : 'transparent',
                      color: hindiInputMode === 'script' ? '#fff' : 'var(--text-muted)',
                      transition: 'all 0.15s ease'
                    }}
                    title="Direct Devanagari Hindi script input"
                  >
                    अ Hindi Script
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={handleToggleVoiceInput}
                className="btn-secondary"
                style={{
                  padding: '4px 10px',
                  fontSize: '0.78rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  color: isListening ? '#ef4444' : 'var(--text-primary)',
                  borderColor: isListening ? '#ef4444' : 'var(--border-subtle)',
                  background: isListening ? 'rgba(239, 68, 68, 0.12)' : 'var(--bg-secondary)',
                  cursor: 'pointer'
                }}
                title={isListening ? 'Stop listening' : `Speak in ${sourceLang === 'hi' ? 'Hindi' : (sourceLang === 'te' ? 'Telugu' : 'English')} to translate`}
              >
                {isListening ? <MicOff size={13} color="#ef4444" /> : <Mic size={13} color="var(--accent-primary)" />}
                <span>{isListening ? 'Listening...' : '🎙 Speak'}</span>
              </button>
              <button
                onClick={handlePaste}
                className="btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.78rem' }}
              >
                📋 Paste
              </button>
            </div>
          </div>

          {/* Live Voice Input Status Banner with Animated Wave */}
          {isListening && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 12px',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              animation: 'recording-pulse 2s infinite ease-in-out'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '3px', alignItems: 'center', height: '16px' }}>
                  <span className="audio-bar" style={{ animationDelay: '0s' }}></span>
                  <span className="audio-bar" style={{ animationDelay: '0.15s' }}></span>
                  <span className="audio-bar" style={{ animationDelay: '0.3s' }}></span>
                  <span className="audio-bar" style={{ animationDelay: '0.45s' }}></span>
                </div>
                <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#10b981' }}>
                  {voiceStatusMessage || `Listening in ${sourceLang === 'hi' ? 'Hindi' : (sourceLang === 'te' ? 'Telugu' : 'English')}... Speak now`}
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleVoiceInput}
                style={{
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '3px 8px',
                  fontSize: '0.74rem',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Stop
              </button>
            </div>
          )}

          {/* On-Device Hindi Transliteration Suggestion Bar */}
          {isHindiSource && hindiInputMode === 'roman' && sourceText.trim() && transliterationService.isRomanHindi(sourceText) && transliterationResult?.all?.length > 0 && (
            <div style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 12px',
              marginBottom: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                  <span style={{ color: '#10b981' }}>⚡ On-Device Suggestion</span>
                  <span style={{ color: 'var(--text-muted)' }}>• Tap or press Tab/Enter to apply</span>
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                  Local-first • No Keystroke Logs
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {transliterationResult.all.map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyTransliteration(suggestion)}
                    style={{
                      background: idx === 0 ? 'var(--accent-gradient)' : 'var(--bg-secondary)',
                      color: idx === 0 ? '#fff' : 'var(--text-primary)',
                      border: idx === 0 ? 'none' : '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '4px 10px',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                    title={idx === 0 ? 'Primary suggestion (Press Tab or Enter to apply)' : `Alternative suggestion ${idx}`}
                  >
                    <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>{idx + 1}.</span>
                    <span>{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            onKeyDown={handleSourceKeyDown}
            placeholder={
              isHindiSource && hindiInputMode === 'roman'
                ? "Type in Roman Hindi (e.g. 'kaha jana hai', 'aap kaha ja rahe ho')..."
                : (isHindiSource ? "हिंदी में यहाँ लिखें..." : "Type or paste any sentence to translate...")
            }
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {sourceText.length} characters
              </span>
              <button
                type="button"
                onClick={handleToggleVoiceInput}
                className="btn-icon"
                style={{
                  padding: '6px',
                  borderRadius: '50%',
                  background: isListening ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-tertiary)',
                  border: isListening ? '1.5px solid #ef4444' : '1px solid var(--border-subtle)',
                  color: isListening ? '#ef4444' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
                title={isListening ? 'Stop Voice Recording' : `Speak to translate in ${sourceLang === 'hi' ? 'Hindi' : (sourceLang === 'te' ? 'Telugu' : 'English')}`}
              >
                {isListening ? <MicOff size={15} color="#ef4444" /> : <Mic size={15} />}
              </button>
            </div>
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
                type="button"
                onClick={() => handleSpeakResult()}
                disabled={!translatedText}
                className="btn-secondary"
                style={{
                  padding: '4px 9px',
                  fontSize: '0.75rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: isSpeakingResult ? 'var(--accent-primary)' : 'inherit',
                  background: isSpeakingResult ? 'rgba(79, 70, 229, 0.12)' : 'var(--bg-secondary)',
                  opacity: translatedText ? 1 : 0.6,
                  cursor: translatedText ? 'pointer' : 'not-allowed'
                }}
                title={isSpeakingResult ? 'Stop Speaking' : `Listen to pronunciation in ${targetLang === 'hi' ? 'Hindi' : (targetLang === 'te' ? 'Telugu' : 'English')}`}
              >
                {isSpeakingResult ? <VolumeX size={13} color="var(--accent-primary)" /> : <Volume2 size={13} />}
                <span>{isSpeakingResult ? 'Stop' : 'Listen'}</span>
              </button>
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
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => handleSpeakResult(alt)}
                        className="btn-icon"
                        style={{ padding: '2px 6px' }}
                        title="Listen to this pronunciation"
                      >
                        <Volume2 size={12} />
                      </button>
                      <button
                        onClick={() => handleCopy(alt)}
                        className="btn-icon"
                        style={{ padding: '2px 6px' }}
                        title="Copy this alternative"
                      >
                        <Copy size={12} />
                      </button>
                    </div>
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
