import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ChatAssistantPage from './pages/ChatAssistantPage';
import TranslatePage from './pages/TranslatePage';
import ReplyAssistantPage from './pages/ReplyAssistantPage';
import LearnPage from './pages/LearnPage';
import PracticePage from './pages/PracticePage';
import VocabularyPage from './pages/VocabularyPage';
import PhrasebookPage from './pages/PhrasebookPage';
import AdminContentPage from './pages/AdminContentPage';
import HistoryPage from './pages/HistoryPage';
import PrivacyCenterPage from './pages/PrivacyCenterPage';
import SettingsPage from './pages/SettingsPage';
import KeyboardSimulator from './components/KeyboardSimulator';
import { storageService } from './services/storageService';
import { translationClient } from './services/translationClient';
import { contentSyncService } from './services/contentSyncService';

export default function App() {
  const [settings, setSettings] = useState(() => storageService.getSettings());
  const [theme, setTheme] = useState(settings.currentTheme || 'Day');
  const [activeTab, setActiveTab] = useState('chat');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(settings.historyProtectionEnabled);
  const [backendHealth, setBackendHealth] = useState(null);

  // Initialize offline-first content sync on boot
  useEffect(() => {
    contentSyncService.initSync();
  }, []);

  // Poll backend health status to keep provider availability synchronized
  useEffect(() => {
    let isMounted = true;
    const fetchHealth = async () => {
      const info = await translationClient.getHealthInfo();
      if (isMounted) setBackendHealth(info);
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Synchronize design tokens on document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-warmth', settings.warmthLevel || 'Medium');
    document.documentElement.setAttribute('data-fontsize', settings.fontSize || 'Medium');
    document.documentElement.setAttribute('data-motion', settings.reducedMotion || 'Off');
  }, [theme, settings]);

  const handleUpdateSettings = (newProps) => {
    const updated = storageService.saveSettings(newProps);
    setSettings(updated);
    if (newProps.currentTheme) setTheme(newProps.currentTheme);
  };

  const renderActivePage = () => {
    switch (activeTab) {
      case 'chat':
        return <ChatAssistantPage settings={settings} />;
      case 'translate':
        return <TranslatePage settings={settings} onUpdateSettings={handleUpdateSettings} backendHealth={backendHealth} />;
      case 'reply':
        return <ReplyAssistantPage settings={settings} />;
      case 'learn':
        return <LearnPage />;
      case 'practice':
        return <PracticePage />;
      case 'vocabulary':
        return <VocabularyPage />;
      case 'phrasebook':
        return <PhrasebookPage />;
      case 'admin-content':
        return <AdminContentPage />;
      case 'history':
        return (
          <HistoryPage
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            isLocked={isLocked}
            setIsLocked={setIsLocked}
          />
        );
      case 'keyboard-sim':
        return <KeyboardSimulator settings={settings} theme={theme} setTheme={setTheme} />;
      case 'privacy':
        return <PrivacyCenterPage settings={settings} onUpdateSettings={handleUpdateSettings} />;
      case 'settings':
        return (
          <SettingsPage
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            theme={theme}
            setTheme={setTheme}
          />
        );
      default:
        return <ChatAssistantPage settings={settings} />;
    }
  };

  return (
    <div className="app-container">
      {/* Top Universal Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        setTheme={(t) => {
          setTheme(t);
          handleUpdateSettings({ currentTheme: t });
        }}
        settings={settings}
        backendHealth={backendHealth}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Main Layout Body */}
      <div className="main-body">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        <main className="content-viewport">
          {renderActivePage()}
        </main>
      </div>

      {/* Mobile Bottom Quick-Access Bar (320px+ phone screen optimization) */}
      <nav className="mobile-bottom-nav" style={{
        display: 'none',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'var(--surface-glass)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--border-subtle)',
        padding: '8px 12px',
        justifyContent: 'space-around',
        zIndex: 50
      }}>
        {[
          { id: 'chat', label: 'Chat', icon: '💬' },
          { id: 'translate', label: 'Translate', icon: '🌐' },
          { id: 'reply', label: 'Reply', icon: '⚡' },
          { id: 'learn', label: 'Learn', icon: '📚' },
          { id: 'keyboard-sim', label: 'Keyboard', icon: '⌨' }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={{
              background: 'transparent',
              border: 'none',
              color: activeTab === item.id ? 'var(--accent-primary)' : 'var(--text-muted)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              fontSize: '0.72rem',
              fontWeight: activeTab === item.id ? 700 : 500,
              cursor: 'pointer'
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <style>{`
        @media (max-width: 768px) {
          .mobile-bottom-nav {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}
