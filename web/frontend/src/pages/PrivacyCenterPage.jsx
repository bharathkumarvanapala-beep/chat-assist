import React, { useState } from 'react';
import { ShieldCheck, Lock, Cpu, Cloud, EyeOff, KeyRound, AlertTriangle, Trash2, CheckCircle2 } from 'lucide-react';
import { storageService } from '../services/storageService';

export default function PrivacyCenterPage({ settings, onUpdateSettings }) {
  const [showCloudConsentModal, setShowCloudConsentModal] = useState(false);
  const [wipeNotice, setWipeNotice] = useState('');

  const handleCloudAiToggle = (enable) => {
    if (enable) {
      setShowCloudConsentModal(true);
    } else {
      onUpdateSettings({ cloudAiEnabled: false });
    }
  };

  const handleConfirmCloudConsent = () => {
    onUpdateSettings({ cloudAiEnabled: true });
    setShowCloudConsentModal(false);
  };

  const handleHardWipe = () => {
    if (window.confirm("CRITICAL CONFIRMATION: This will permanently wipe all local history, saved phrasebooks, vocabulary, and preferences from this browser. This cannot be undone. Proceed?")) {
      storageService.clearAllUserData();
      setWipeNotice('All local data wiped permanently. Application restored to clean state.');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={28} color="#10b981" />
          <h2 style={{ fontSize: '1.6rem', margin: 0 }}>Privacy Center & Transparency Dashboard</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', margin: '4px 0 0 0' }}>
          Privacy is not an afterthought in Hindi Assist — it is the core foundational architecture.
        </p>
      </div>

      {wipeNotice && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          color: '#ef4444',
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px',
          fontWeight: 600
        }}>
          {wipeNotice}
        </div>
      )}

      {/* Real-Time Privacy Status Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div className="glass-card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', marginBottom: '6px' }}>
            <Cpu size={18} />
            <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>TRANSLATION ENGINE</span>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>📱 On-device (Default)</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Processed locally without remote server dispatch.
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', marginBottom: '6px' }}>
            <Lock size={18} />
            <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>TRANSLATION HISTORY</span>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>
            {settings.historyEnabled ? '🔒 Local Device Only' : 'OFF (Private Default)'}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Never synced to cloud unless explicitly authorized.
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: settings.cloudAiEnabled ? '#f59e0b' : '#10b981', marginBottom: '6px' }}>
            <Cloud size={18} />
            <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>CLOUD AI STATUS</span>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>
            {settings.cloudAiEnabled ? '☁ Enabled (Opt-in)' : 'OFF (Default)'}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Third-party cloud transmission requires explicit consent.
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', marginBottom: '6px' }}>
            <EyeOff size={18} />
            <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>KEYSTROKE & CLIPBOARD</span>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>0% Logging</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Clipboard is read strictly on user tap. Zero keystroke analytics.
          </div>
        </div>
      </div>

      {/* Strict Privacy Guarantees */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '28px' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Our Zero-Compromise Guarantees</h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ fontSize: '0.92rem' }}>No WhatsApp Scraping or Snooping</strong>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Hindi Assist never accesses private WhatsApp databases, network packets, or contact lists. You copy what you want to translate.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ fontSize: '0.92rem' }}>Never Automatically Sends Messages</strong>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Hindi Assist inserts translated text into the active field upon user request. You always manually press WhatsApp's Send button.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ fontSize: '0.92rem' }}>Sensitive & Password Input Shield</strong>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Password fields and OTP entries are automatically detected via Android InputType and completely ignored by the translation engine.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ fontSize: '0.92rem' }}>Personal Data Ownership</strong>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Your history, phrasebook, and vocabulary belong to you. They are never sold, never shared, and never used to train public models.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Engine Intelligent Routing Architecture */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Intelligent Multi-Engine Routing Matrix</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              Requests are dynamically routed to the best engine balancing extreme privacy with contextual intelligence.
            </p>
          </div>
          <span className="badge-pill badge-on-device" style={{ fontSize: '0.78rem' }}>
            Gemini Key Ready Architecture
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid var(--border-subtle)' }}>
                <th style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>Request Type</th>
                <th style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>Assigned Best Engine</th>
                <th style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>Privacy & Processing Mode</th>
              </tr>
            </thead>
            <tbody>
              {[
                { req: 'Simple translation', engine: 'On-device', badge: 'badge-on-device', note: 'Processed locally via ML Kit / Local Synthesizer' },
                { req: 'Vocabulary lookup', engine: 'Local data', badge: 'badge-on-device', note: 'Instant structured lookup from local vocabulary.json' },
                { req: 'Common phrase', engine: 'Local data', badge: 'badge-on-device', note: 'Fast pattern match from local phrases.json' },
                { req: 'Meaning explanation', engine: 'Gemini', badge: 'badge-cloud', note: 'Deep grammatical breakdown & SOV syntax analysis' },
                { req: 'Contextual translation', engine: 'Gemini', badge: 'badge-cloud', note: 'Multi-turn context & conversational nuance synthesis' },
                { req: 'Reply suggestions', engine: 'Gemini', badge: 'badge-cloud', note: 'Context-aware suggestions across 5+ Indian chat tones' },
                { req: 'Grammar correction', engine: 'Gemini', badge: 'badge-cloud', note: 'Identifies subtle errors & provides gentle practice' },
                { req: 'Learning explanation', engine: 'Gemini', badge: 'badge-cloud', note: 'Beginner-friendly breakdown of complex idioms' },
                { req: 'Conversation practice', engine: 'Gemini', badge: 'badge-cloud', note: 'Interactive AI persona for realistic roleplay chats' },
                { req: 'Privacy-sensitive normal translation', engine: 'On-device', badge: 'badge-on-device', note: 'Passwords/sensitive data strictly shielded on-device' }
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 600 }}>{row.req}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span className={`badge-pill ${row.badge}`} style={{ fontSize: '0.78rem' }}>
                      {row.engine === 'Gemini' ? '✨ Gemini' : (row.engine === 'On-device' ? '📱 On-device' : '📖 Local data')}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cloud AI Toggle with Explicit Consent Guard */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h4 style={{ fontSize: '1.05rem', margin: 0 }}>Optional Cloud AI Translation</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              Allows sending text to advanced cloud models for nuanced idiom synthesis. OFF by default.
            </p>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: 'var(--bg-tertiary)', padding: '8px 16px', borderRadius: 'var(--radius-sm)' }}>
            <input
              type="checkbox"
              checked={settings.cloudAiEnabled}
              onChange={(e) => handleCloudAiToggle(e.target.checked)}
            />
            <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>
              {settings.cloudAiEnabled ? 'Cloud AI: ENABLED' : 'Cloud AI: OFF'}
            </span>
          </label>
        </div>
      </div>

      {/* Danger Zone: Hard Data Reset */}
      <div className="glass-card" style={{ padding: '24px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h4 style={{ fontSize: '1.05rem', color: '#ef4444', margin: 0 }}>Wipe All Local Data</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              Permanently purges all cached history, phrasebook items, vocabulary words, and local credentials.
            </p>
          </div>

          <button onClick={handleHardWipe} className="btn-secondary" style={{ color: '#ef4444', borderColor: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Trash2 size={16} />
            <span>Hard Reset All Data</span>
          </button>
        </div>
      </div>

      {/* Cloud AI Explicit Consent Modal (Section 22: 192 & 193) */}
      {showCloudConsentModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px'
        }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '480px', padding: '26px', background: 'var(--bg-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f59e0b', marginBottom: '12px' }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Cloud AI Privacy Notice</h3>
            </div>

            <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: '14px' }}>
              "Your selected text may be sent to an online AI service for improved translation."
            </p>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
              When Cloud AI is enabled, messages you explicitly translate will display the <strong>☁ Cloud AI</strong> badge. Keystroke analytics and unselected text remain 100% private.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setShowCloudConsentModal(false)} className="btn-secondary">
                Keep On-Device Only
              </button>
              <button onClick={handleConfirmCloudConsent} className="btn-primary" style={{ background: '#f59e0b', borderColor: '#f59e0b' }}>
                I Understand & Consent
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
