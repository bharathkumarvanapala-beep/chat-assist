import React from 'react';
import { ShieldCheck, Cloud, Cpu, Palette, Menu, Lock } from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  theme,
  setTheme,
  settings,
  backendHealth,
  mobileMenuOpen,
  setMobileMenuOpen
}) {
  const themes = ['Day', 'Night', 'Blue', 'Green', 'Reading'];
  const isGeminiReady = backendHealth?.orchestrator?.geminiAvailable === true;
  const isCloudActive = Boolean(settings.cloudAiEnabled && isGeminiReady);

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 28px',
      borderBottom: '1px solid var(--border-subtle)',
      background: 'var(--surface-glass)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      {/* Brand & Tagline */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button
          className="btn-icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{ display: 'none' }}
          id="mobile-menu-toggle"
          aria-label="Toggle Navigation Menu"
        >
          <Menu size={22} />
        </button>

        <div
          onClick={() => setActiveTab('chat')}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        >
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)',
            color: '#fff',
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 800,
            fontSize: '1.4rem'
          }}>
            ह
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.25rem', letterSpacing: '-0.02em', margin: 0 }}>HINDI ASSIST</h1>
              <span
                className={`badge-pill ${isCloudActive ? 'badge-cloud' : 'badge-on-device'}`}
                title={
                  settings.cloudAiEnabled
                    ? (isGeminiReady ? 'Cloud AI (Gemini) Active' : 'Cloud AI unavailable: GEMINI_API_KEY not configured in backend/.env')
                    : 'Operating in On-device mode'
                }
              >
                {isCloudActive ? <><Cloud size={12} /> Cloud AI</> : <><Cpu size={12} /> On-device</>}
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
              Understand every message. Reply naturally. • <strong style={{ color: 'var(--accent-primary)' }}>English • Hindi • Telugu</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Right Controls: Quick Theme & Privacy Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Privacy Shield Pill */}
        <div
          onClick={() => setActiveTab('privacy')}
          className="badge-pill"
          style={{
            cursor: 'pointer',
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)',
            padding: '6px 12px'
          }}
          title="Privacy Center: Zero-log guarantee"
        >
          <ShieldCheck size={14} color="#10b981" />
          <span>Zero Logs</span>
          {settings.historyProtectionEnabled && <Lock size={12} color="#f59e0b" />}
        </div>

        {/* Theme Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Palette size={16} color="var(--text-muted)" />
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            style={{
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 10px',
              fontSize: '0.85rem',
              outline: 'none',
              cursor: 'pointer'
            }}
            aria-label="Select Appearance Theme"
          >
            {themes.map(t => (
              <option key={t} value={t}>{t} Theme</option>
            ))}
          </select>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          #mobile-menu-toggle {
            display: inline-flex !important;
          }
        }
      `}</style>
    </header>
  );
}
