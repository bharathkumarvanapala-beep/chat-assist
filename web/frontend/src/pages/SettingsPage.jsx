import React, { useState, useEffect } from 'react';
import { Settings, Palette, Type, Shield, HardDrive, Cpu, Check, Download, Info, Sparkles, RefreshCw, Key, CheckCircle2, AlertCircle } from 'lucide-react';
import { translationClient } from '../services/translationClient';

export default function SettingsPage({ settings, onUpdateSettings, theme, setTheme }) {
  const [modelHindiStatus, setModelHindiStatus] = useState('Ready');
  const [modelTeluguStatus, setModelTeluguStatus] = useState('Ready');
  const [downloadingLang, setDownloadingLang] = useState(null);
  const [savedNotice, setSavedNotice] = useState('');
  const [geminiHealth, setGeminiHealth] = useState(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  const fetchAiHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const data = await translationClient.getHealthInfo();
      setGeminiHealth(data);
    } catch {
      setGeminiHealth({ status: 'offline', gemini_status: 'WAITING_FOR_API_KEY' });
    } finally {
      setIsCheckingHealth(false);
    }
  };

  useEffect(() => {
    fetchAiHealth();
  }, []);

  const themes = [
    { id: 'Day', label: 'Day Mode', desc: 'Bright, glare-free, high contrast' },
    { id: 'Night', label: 'Night Mode', desc: 'Dark ergonomic slate, reduced glare' },
    { id: 'Blue', label: 'Blue Theme', desc: 'Deep professional sapphire' },
    { id: 'Green', label: 'Green Theme', desc: 'Calming emerald and sage tones' },
    { id: 'Reading', label: 'Reading / Eye Comfort', desc: 'Warm off-white surfaces, softer accents' }
  ];

  const handleDownloadModel = (lang) => {
    setDownloadingLang(lang);
    setTimeout(() => {
      if (lang === 'Hindi') setModelHindiStatus('Ready');
      if (lang === 'Telugu') setModelTeluguStatus('Ready');
      setDownloadingLang(null);
      setSavedNotice(`${lang} On-Device ML Kit model ready!`);
      setTimeout(() => setSavedNotice(''), 3000);
    }, 1500);
  };

  const handleUpdate = (updates) => {
    onUpdateSettings(updates);
    setSavedNotice('Settings updated.');
    setTimeout(() => setSavedNotice(''), 2000);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Settings size={26} color="var(--accent-primary)" />
          <h2 style={{ fontSize: '1.6rem', margin: 0 }}>Settings & Appearance</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', margin: '4px 0 0 0' }}>
          Customize your themes, reading comfort, default translation directions, and on-device models.
        </p>
      </div>

      {savedNotice && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          color: '#10b981',
          padding: '10px 16px',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '20px',
          fontWeight: 600
        }}>
          ✓ {savedNotice}
        </div>
      )}

      {/* 1. APPEARANCE SYSTEM & THEMES */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Palette size={20} color="var(--accent-primary)" />
          <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Appearance & Themes</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
          {themes.map(t => (
            <div
              key={t.id}
              onClick={() => {
                setTheme(t.id);
                handleUpdate({ currentTheme: t.id });
              }}
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                border: theme === t.id ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                background: theme === t.id ? 'var(--badge-bg)' : 'var(--bg-tertiary)',
                cursor: 'pointer',
                transition: 'border-color var(--transition-fast)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: theme === t.id ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                  {t.label}
                </span>
                {theme === t.id && <Check size={16} color="var(--accent-primary)" />}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {t.desc}
              </div>
            </div>
          ))}
        </div>

        {/* Reading Mode Comfort Modifiers */}
        {theme === 'Reading' && (
          <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '10px' }}>
              Reading / Eye Comfort Settings
            </div>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Warmth Level:</span>
                <select
                  value={settings.warmthLevel}
                  onChange={(e) => handleUpdate({ warmthLevel: e.target.value })}
                  className="input-field"
                  style={{ width: '130px', padding: '6px 10px' }}
                >
                  <option value="Low">Low Warmth</option>
                  <option value="Medium">Medium Warmth</option>
                  <option value="High">High Warmth</option>
                </select>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Contrast:</span>
                <select
                  value={settings.contrastLevel}
                  onChange={(e) => handleUpdate({ contrastLevel: e.target.value })}
                  className="input-field"
                  style={{ width: '130px', padding: '6px 10px' }}
                >
                  <option value="Normal">Normal</option>
                  <option value="Comfort">Comfort</option>
                </select>
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', fontStyle: 'italic' }}>
              "Designed for a softer, more comfortable reading experience."
            </div>
          </div>
        )}

        {/* Font Size & Motion */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Font Size:
            </label>
            <select
              value={settings.fontSize}
              onChange={(e) => handleUpdate({ fontSize: e.target.value })}
              className="input-field"
            >
              <option value="Small">Small</option>
              <option value="Medium">Medium (Default)</option>
              <option value="Large">Large</option>
              <option value="Extra Large">Extra Large</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Motion Effects:
            </label>
            <select
              value={settings.reducedMotion}
              onChange={(e) => handleUpdate({ reducedMotion: e.target.value })}
              className="input-field"
            >
              <option value="Off">Full Animations (Default)</option>
              <option value="Reduced">Reduced Motion</option>
              <option value="Off">Off</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. TRANSLATION & CONVERSATION DEFAULTS */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Translation Defaults</h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Default Incoming Translation:
            </label>
            <select
              value={settings.defaultTargetLang}
              onChange={(e) => handleUpdate({ defaultTargetLang: e.target.value })}
              className="input-field"
            >
              <option value="hi">Hindi (Default)</option>
              <option value="en">English</option>
              <option value="te">Telugu</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Default Reply Tone:
            </label>
            <select
              value={settings.defaultTone}
              onChange={(e) => handleUpdate({ defaultTone: e.target.value })}
              className="input-field"
            >
              <option value="Casual">Casual (Default)</option>
              <option value="Friendly">Friendly</option>
              <option value="Neutral">Neutral</option>
              <option value="Polite">Polite</option>
              <option value="Formal">Formal</option>
              <option value="Work">Work</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              History Auto-Lock Timeout:
            </label>
            <select
              value={settings.autoLockTimeout}
              onChange={(e) => handleUpdate({ autoLockTimeout: e.target.value })}
              className="input-field"
            >
              <option value="Immediately">Immediately</option>
              <option value="1 minute">1 minute</option>
              <option value="5 minutes">5 minutes (Default)</option>
              <option value="15 minutes">15 minutes</option>
              <option value="Never">Never</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. ON-DEVICE TRANSLATION MODEL MANAGEMENT */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <HardDrive size={20} color="var(--accent-primary)" />
          <h3 style={{ fontSize: '1.2rem', margin: 0 }}>On-Device Translation Models (Google ML Kit)</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
            <div>
              <strong>English Base Model</strong>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Core system model (Packaged)</div>
            </div>
            <span className="badge-pill badge-on-device">Ready</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
            <div>
              <strong>Hindi (Devanagari) Translation Model</strong>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Conversational Indian Hindi model</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge-pill badge-on-device">{modelHindiStatus}</span>
              {modelHindiStatus !== 'Ready' && (
                <button onClick={() => handleDownloadModel('Hindi')} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                  {downloadingLang === 'Hindi' ? 'Downloading...' : 'Download'}
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
            <div>
              <strong>Telugu Translation Model</strong>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Conversational Telugu model</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge-pill badge-on-device">{modelTeluguStatus}</span>
              {modelTeluguStatus !== 'Ready' && (
                <button onClick={() => handleDownloadModel('Telugu')} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                  {downloadingLang === 'Telugu' ? 'Downloading...' : 'Download'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. GOOGLE GEMINI CLOUD AI CONFIGURATION */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={22} color="#f59e0b" />
            <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Google Gemini Cloud AI Integration</h3>
          </div>
          <button 
            onClick={fetchAiHealth} 
            className="btn-secondary" 
            disabled={isCheckingHealth}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '0.8rem' }}
          >
            <RefreshCw size={14} className={isCheckingHealth ? 'spin' : ''} />
            <span>{isCheckingHealth ? 'Checking...' : 'Refresh AI Status'}</span>
          </button>
        </div>

        {/* Current Status Box */}
        <div style={{
          background: geminiHealth?.gemini_status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
          border: `1px solid ${geminiHealth?.gemini_status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {geminiHealth?.gemini_status === 'ACTIVE' ? (
                <CheckCircle2 size={22} color="#10b981" />
              ) : (
                <AlertCircle size={22} color="#f59e0b" />
              )}
              <div>
                <strong style={{ fontSize: '0.98rem', color: geminiHealth?.gemini_status === 'ACTIVE' ? '#10b981' : '#f59e0b' }}>
                  {geminiHealth?.gemini_status === 'ACTIVE' 
                    ? 'Gemini Cloud AI is Active & Ready' 
                    : 'Gemini Waiting for API Key (Local Fallback Active)'}
                </strong>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {geminiHealth?.gemini_status === 'ACTIVE'
                    ? `Powered by official @google/genai SDK (${geminiHealth?.gemini_model || 'gemini-2.5-flash'})`
                    : 'System seamlessly falls back to 100% offline local conversational NLP rules without crashing.'}
                </p>
              </div>
            </div>
            <span className={`badge-pill ${geminiHealth?.gemini_status === 'ACTIVE' ? 'badge-cloud' : 'badge-on-device'}`} style={{ fontSize: '0.82rem' }}>
              {geminiHealth?.gemini_status === 'ACTIVE' ? '✨ Gemini Active' : '📱 100% Local Fallback'}
            </span>
          </div>
        </div>

        {/* Setup Instructions */}
        <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.9rem', marginBottom: '8px' }}>
            <Key size={16} color="var(--accent-primary)" />
            <span>How to add your Gemini API Key</span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 10px 0', lineHeight: 1.5 }}>
            Whenever you are ready, add your Google Gemini API key to your backend configuration. The routing engine will automatically detect it:
          </p>
          <div style={{
            background: 'var(--bg-primary)',
            padding: '12px 14px',
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'monospace',
            fontSize: '0.8rem',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
            overflowX: 'auto'
          }}>
            <div><span style={{ color: 'var(--text-muted)' }}># File: </span><strong>hindi-assist/backend/.env</strong></div>
            <div style={{ marginTop: '4px' }}><span style={{ color: '#10b981' }}>GEMINI_API_KEY</span>=your_gemini_api_key_here</div>
            <div style={{ marginTop: '2px' }}><span style={{ color: 'var(--text-muted)' }}>GEMINI_MODEL</span>=gemini-2.5-flash</div>
          </div>
        </div>

        {/* Engine Routing Spec Table */}
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '10px' }}>
            Configured Engine Routing Table:
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>Request</th>
                  <th style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>Best engine</th>
                  <th style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>Behavior</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { r: 'Simple translation', e: 'On-device', b: 'Processed locally via ML Kit / synthesizer' },
                  { r: 'Vocabulary lookup', e: 'Local data', b: 'Instant query from vocabulary.json' },
                  { r: 'Common phrase', e: 'Local data', b: 'Direct match from phrases.json' },
                  { r: 'Meaning explanation', e: 'Gemini', b: 'Gemini AI breakdown (or local grammar analysis)' },
                  { r: 'Contextual translation', e: 'Gemini', b: 'Multi-turn context synthesis (or tone matcher)' },
                  { r: 'Reply suggestions', e: 'Gemini', b: 'Conversational replies across 5 Indian tones' },
                  { r: 'Grammar correction', e: 'Gemini', b: 'Grammar diagnostics & friendly correction' },
                  { r: 'Learning explanation', e: 'Gemini', b: 'Comprehensive linguistic concept guides' },
                  { r: 'Conversation practice', e: 'Gemini', b: 'Interactive AI roleplay conversations' },
                  { r: 'Privacy-sensitive normal translation', e: 'On-device', b: 'Strictly kept on-device, passwords shielded' },
                ].map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '7px 10px', fontWeight: 600 }}>{row.r}</td>
                    <td style={{ padding: '7px 10px' }}>
                      <span className={`badge-pill ${row.e === 'Gemini' ? 'badge-cloud' : 'badge-on-device'}`} style={{ fontSize: '0.72rem' }}>
                        {row.e === 'Gemini' ? '✨ Gemini' : (row.e === 'On-device' ? '📱 On-device' : '📖 Local data')}
                      </span>
                    </td>
                    <td style={{ padding: '7px 10px', color: 'var(--text-secondary)' }}>{row.b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 5. ABOUT HINDI ASSIST (Section 105) */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Info size={18} color="var(--text-muted)" />
          <h3 style={{ fontSize: '1.1rem', margin: 0 }}>About Hindi Assist</h3>
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <p><strong>Version:</strong> 1.0.0 (Production Release)</p>
          <p><strong>Primary Tagline:</strong> Understand every message. Reply naturally.</p>
          <p><strong>Secondary Tagline:</strong> English • Hindi • Telugu</p>
          <p><strong>Translation Engines:</strong> Google ML Kit Translation (Android) • Conversational NLP Synthesizer (Web & Backend)</p>
          <p><strong>Privacy Architecture:</strong> Zero-Log Policy, Local-First History, Sensitive Field Protection</p>
          <p><strong>Licenses:</strong> Apache-2.0 Open Source Platform</p>
        </div>
      </div>
    </div>
  );
}
