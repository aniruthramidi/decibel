import { motion } from 'motion/react';
import { Music2, Search, Library, Settings, LogOut, Video, User } from 'lucide-react';

const TABS = [
  { id: 'home',     label: 'Now Playing', icon: Music2 },
  { id: 'search',   label: 'Search',      icon: Search  },
  { id: 'library',  label: 'Library',     icon: Library },
  { id: 'playlists',label: 'YT Playlists',icon: Video },
  { id: 'account',  label: 'Account',     icon: User    },
  { id: 'settings', label: 'Connect',     icon: Settings },
];

export default function Sidebar({ activeTab, setActiveTab, spotifyAuth, appleAuth, session, onLogout, isPlaying }) {
  const initial = session?.name?.[0]?.toUpperCase() || '?';

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'relative',
        zIndex: 20,
        padding: '20px 24px 0',
        width: '100%',
        flexShrink: 0,
      }}
    >
      <div className="liquid-glass" style={{
        borderRadius: '9999px',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: '960px',
        margin: '0 auto',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,255,255,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Music2 size={16} color="#fff" />
          </div>
          <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: '20px', color: '#fff', lineHeight: 1 }}>
            Decibel
          </span>
        </div>

        {/* Nav tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '7px 16px',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: 500,
                fontFamily: "'Inter', sans-serif",
                color: activeTab === id ? '#fff' : 'rgba(255,255,255,0.55)',
                background: activeTab === id ? 'rgba(255,255,255,0.1)' : 'transparent',
                transition: 'all 0.2s ease',
                letterSpacing: '-0.01em',
                border: activeTab === id ? '1px solid rgba(255,255,255,0.12)' : '1px solid transparent',
                position: 'relative',
              }}
            >
              <Icon size={14} />
              <span className="hidden-mobile">{label}</span>
              {id === 'home' && isPlaying && (
                <span className="live-pulse-dot" style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#1db954',
                  marginLeft: '2px',
                  display: 'inline-block',
                }} />
              )}
            </button>
          ))}
        </div>

        {/* User info + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {/* Connection dots */}
          {spotifyAuth && (
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#1db954', boxShadow: '0 0 6px rgba(29,185,84,0.6)' }} title="Spotify connected" />
          )}
          {appleAuth && (
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fc3c44', boxShadow: '0 0 6px rgba(252,60,68,0.6)' }} title="Apple Music connected" />
          )}

          {/* Avatar initial */}
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.05))',
            border: '1px solid rgba(255,255,255,0.14)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: 700, color: '#fff',
          }}>
            {initial}
          </div>

          {/* Name */}
          <span style={{
            fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.65)',
            maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {session?.name || 'Listener'}
          </span>

          {/* Logout button */}
          <button
            onClick={onLogout}
            title="Sign out"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 28, height: 28, borderRadius: '50%',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.4)',
              cursor: 'pointer', transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(252,60,68,0.12)';
              e.currentTarget.style.color = '#fc3c44';
              e.currentTarget.style.borderColor = 'rgba(252,60,68,0.2)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
            }}
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </motion.nav>
  );
}
