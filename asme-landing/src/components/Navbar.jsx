import { motion } from 'motion/react'
import { Music2, LogOut } from 'lucide-react'

export default function Navbar({ user, onLogout, activeTab, setActiveTab }) {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0,  opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{ position: 'relative', zIndex: 20, padding: '20px 24px 0', flexShrink: 0 }}
    >
      <div className="liquid-glass" style={{
        borderRadius: 9999, padding: '10px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        maxWidth: 960, margin: '0 auto',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: '25%', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/logo.jpg" alt="Decibel" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20, color: '#fff', lineHeight: 1 }}>
            Decibel
          </span>
        </div>


        {/* Navigation Tabs */}
        {user && (
          <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.03)', borderRadius: 9999, padding: 3, border: '1px solid rgba(255,255,255,0.04)' }}>
            {[
              { id: 'player', label: 'Player' },
              { id: 'playlists', label: 'Playlists' },
              { id: 'account', label: 'Account' },
              { id: 'profile', label: 'Profile' }
            ].map(tab => {
              const isSelected = 
                tab.id === 'player' ? ['trending', 'search', 'saved', 'queue'].includes(activeTab) :
                activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === 'player') setActiveTab('trending');
                    else setActiveTab(tab.id);
                  }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 9999,
                    border: 'none',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(255,255,255,0.09)' : 'transparent',
                    color: isSelected ? '#fff' : 'rgba(255,255,255,0.4)',
                    transition: 'all 0.15s',
                  }}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        )}

        {/* User + logout */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.45)' }}>
              {user.name}
            </span>
            <button
              onClick={onLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 12px', borderRadius: 9999,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 500,
                fontFamily: 'inherit', transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.85)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
            >
              <LogOut size={12} /> Sign out
            </button>
          </div>
        )}
      </div>
    </motion.nav>
  )
}
