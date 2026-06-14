import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Music2, Eye, EyeOff, ArrowRight } from 'lucide-react'
import BackgroundVideo from './BackgroundVideo'

/* ── simple localStorage auth ──────────────────────────────── */
const USERS_KEY   = 'decibel_users'
const SESSION_KEY = 'decibel_session'

function getUsers()  { try { return JSON.parse(localStorage.getItem(USERS_KEY)   || '{}') } catch { return {} } }
function saveUser(email, pw) { const u = getUsers(); u[email.toLowerCase()] = pw; localStorage.setItem(USERS_KEY, JSON.stringify(u)) }
function checkCreds(email, pw) { return getUsers()[email.toLowerCase()] === pw }

export function saveSession(name, email) { localStorage.setItem(SESSION_KEY, JSON.stringify({ name, email })) }
export function getSession()             { try { return JSON.parse(localStorage.getItem(SESSION_KEY)) } catch { return null } }
export function clearSession()           { localStorage.removeItem(SESSION_KEY) }

/* ── field ─────────────────────────────────────────────────── */
function Field({ label, type = 'text', value, onChange, placeholder, autoFocus, right }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={type} value={value} onChange={onChange}
          placeholder={placeholder} autoFocus={autoFocus}
          style={{
            width: '100%', padding: right ? '12px 44px 12px 16px' : '12px 16px',
            borderRadius: 14, fontSize: 14,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff', fontFamily: 'inherit', outline: 'none',
            transition: 'all 0.2s',
          }}
          onFocus={e => { e.target.style.borderColor = 'rgba(255,255,255,0.28)'; e.target.style.background = 'rgba(255,255,255,0.07)' }}
          onBlur={e  => { e.target.style.borderColor = 'rgba(255,255,255,0.1)';  e.target.style.background = 'rgba(255,255,255,0.04)' }}
        />
        {right && <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }}>{right}</div>}
      </div>
    </div>
  )
}

/* ── main login page ────────────────────────────────────────── */
export default function LoginPage({ onAuth }) {
  const [mode,   setMode]   = useState('login') // 'login' | 'signup'
  const [email,  setEmail]  = useState('')
  const [pw,     setPw]     = useState('')
  const [name,   setName]   = useState('')
  const [showPw, setShowPw] = useState(false)
  const [err,    setErr]    = useState('')
  const [busy,   setBusy]   = useState(false)

  useEffect(() => { setErr(''); setEmail(''); setPw(''); setName('') }, [mode])

  async function submit(e) {
    e.preventDefault()
    setErr('')
    if (!email.trim() || !pw.trim()) return setErr('Please fill in all fields.')
    if (pw.length < 8)               return setErr('Password must be at least 8 characters.')
    setBusy(true)
    
    try {
      const url = mode === 'signup' ? '/api/auth/register' : '/api/auth/login'
      const body = mode === 'signup'
        ? { email: email.trim(), password: pw, name: name.trim() || email.split('@')[0] }
        : { email: email.trim(), password: pw }
        
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || 'Authentication failed.')
      }
      
      saveSession(data.name, data.email)
      onAuth({ name: data.name, email: data.email })
    } catch (error) {
      setErr(error.message || 'Server error. Please try again.')
      setBusy(false)
    }
  }

  async function guest() {
    try {
      // Try to register/login guest account on backend
      await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'guest@decibel.app', password: 'guestpassword', name: 'Listener' })
      })
    } catch (e) {}

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'guest@decibel.app', password: 'guestpassword' })
      })
      if (response.ok) {
        const data = await response.json()
        saveSession(data.name, data.email)
        onAuth({ name: data.name, email: data.email })
        return
      }
    } catch (e) {}
    
    // local fallback
    saveSession('Listener', 'guest@decibel.app')
    onAuth({ name: 'Listener', email: 'guest@decibel.app' })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
      <BackgroundVideo />
      {/* overlay */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'radial-gradient(ellipse at 50% 40%, rgba(0,0,0,0.2), rgba(0,0,0,0.8))' }} />

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 400, padding: 24 }}
      >
        <div className="liquid-glass" style={{ borderRadius: 28, padding: '36px 32px 28px', display: 'flex', flexDirection: 'column', gap: 22 }}>
          {/* logo */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: '25%', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <img src="/logo.jpg" alt="Decibel" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 28, color: '#fff', marginBottom: 4 }}>Decibel</h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)' }}>
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </p>
          </div>

          {/* error */}
          <AnimatePresence>
            {err && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ fontSize: 13, color: '#fc3c44', background: 'rgba(252,60,68,0.1)', border: '1px solid rgba(252,60,68,0.2)', borderRadius: 10, padding: '9px 13px' }}>
                {err}
              </motion.p>
            )}
          </AnimatePresence>

          {/* form */}
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mode === 'signup' && (
              <Field label="Name" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" autoFocus />
            )}
            <Field label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoFocus={mode === 'login'} />
            <Field
              label="Password" type={showPw ? 'text' : 'password'}
              value={pw} onChange={e => setPw(e.target.value)} placeholder="••••••••"
              right={
                <button type="button" onClick={() => setShowPw(s => !s)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', display: 'flex' }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
            />

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={busy}
              style={{
                width: '100%', padding: 13, borderRadius: 14, marginTop: 4,
                background: busy ? 'rgba(255,255,255,0.6)' : '#fff',
                color: '#000', fontSize: 14, fontWeight: 600, border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s',
              }}
            >
              {busy
                ? <span style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                : <>{mode === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight size={15} /></>
              }
            </motion.button>
          </form>

          {/* toggle */}
          <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => setMode(m => m === 'login' ? 'signup' : 'login')}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', fontWeight: 600, fontFamily: 'inherit' }}>
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>

          {/* guest */}
          <button onClick={guest} style={{ background: 'none', border: 'none', fontSize: 12, color: 'rgba(255,255,255,0.22)', textDecoration: 'underline', textUnderlineOffset: 3, fontFamily: 'inherit', textAlign: 'center' }}>
            Continue as Guest →
          </button>
        </div>
      </motion.div>
    </div>
  )
}
