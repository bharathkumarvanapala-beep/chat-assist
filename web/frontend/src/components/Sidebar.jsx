import React from 'react';
import {
  MessageSquare,
  Languages,
  Reply,
  BookOpen,
  Brain,
  Bookmark,
  BookA,
  History,
  Shield,
  Settings,
  Keyboard
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, mobileMenuOpen, setMobileMenuOpen }) {
  const navItems = [
    { id: 'chat', label: 'Chat Assistant', icon: MessageSquare, badge: 'Popular' },
    { id: 'translate', label: 'Translate', icon: Languages },
    { id: 'reply', label: 'Help Me Reply', icon: Reply, badge: 'Smart' },
    { id: 'learn', label: 'Learn & Patterns', icon: BookOpen },
    { id: 'practice', label: 'Practice & Quizzes', icon: Brain },
    { id: 'vocabulary', label: 'My Vocabulary', icon: BookA },
    { id: 'phrasebook', label: 'My Phrasebook', icon: Bookmark },
    { id: 'history', label: 'History & Search', icon: History },
    { id: 'keyboard-sim', label: 'Android Keyboard', icon: Keyboard, badge: 'Demo' },
    { id: 'privacy', label: 'Privacy Center', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <>
      <aside
        className={`sidebar-nav ${mobileMenuOpen ? 'mobile-open' : ''}`}
        style={{
          width: '260px',
          borderRight: '1px solid var(--border-subtle)',
          background: 'var(--surface-card)',
          padding: '20px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          flexShrink: 0,
          transition: 'transform var(--transition-normal)'
        }}
      >
        <div style={{ padding: '0 8px 12px 8px', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 700 }}>
          Navigation
        </div>

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setMobileMenuOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: isActive ? 'var(--accent-gradient)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.92rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background var(--transition-fast), color var(--transition-fast), transform var(--transition-fast)'
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Icon size={19} color={isActive ? '#ffffff' : 'currentColor'} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && (
                <span style={{
                  fontSize: '0.7rem',
                  padding: '2px 7px',
                  borderRadius: 'var(--radius-full)',
                  background: isActive ? 'rgba(255,255,255,0.25)' : 'var(--badge-bg)',
                  color: isActive ? '#ffffff' : 'var(--badge-text)',
                  fontWeight: 600
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div style={{ marginTop: 'auto', padding: '16px 8px 4px 8px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <p><strong>Hindi Assist v1.0</strong></p>
          <p>Privacy-First Multilingual Platform</p>
        </div>
      </aside>

      <style>{`
        @media (max-width: 900px) {
          .sidebar-nav {
            position: fixed;
            top: 70px;
            bottom: 0;
            left: 0;
            z-index: 40;
            transform: translateX(-100%);
            box-shadow: var(--shadow-lg);
          }
          .sidebar-nav.mobile-open {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}
