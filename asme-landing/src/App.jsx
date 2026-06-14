import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

import BackgroundVideo from './components/BackgroundVideo'
import LoginPage, { getSession, clearSession } from './components/LoginPage'
import Navbar from './components/Navbar'
import Player from './components/Player'

export default function App() {
  const [user, setUser] = useState(() => getSession())
  const [activeTab, setActiveTab] = useState('trending')

  function handleAuth(u) { setUser(u) }
  function handleLogout() { clearSession(); setUser(null) }

  return (
    <AnimatePresence mode="wait">
      {/* ── Login ── */}
      {!user ? (
        <LoginPage key="login" onAuth={handleAuth} />
      ) : (
        /* ── App ── */
        <motion.div
          key="app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          style={{
            position: 'fixed', inset: 0,
            display: 'flex', flexDirection: 'column',
            background: '#000', overflow: 'hidden',
          }}
        >
          <BackgroundVideo />
          {/* dark gradient so content is readable */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'radial-gradient(ellipse at 50% 20%, rgba(0,0,0,0.2), rgba(0,0,0,0.7))' }} />

          <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <Navbar user={user} onLogout={handleLogout} activeTab={activeTab} setActiveTab={setActiveTab} />

            {/* scrollable main area */}
            <main style={{ flex: 1, overflowY: 'auto', padding: '24px 0 0' }}>
              <Player user={user} onUpdateUser={setUser} activeTab={activeTab} setActiveTab={setActiveTab} />
            </main>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
