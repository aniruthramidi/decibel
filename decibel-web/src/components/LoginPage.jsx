import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Music2, Eye, EyeOff, ArrowRight, Globe } from 'lucide-react';
import BackgroundVideo from './BackgroundVideo';
import { supabase } from '../services/supabaseClient';

/* ── Simple auth helpers (demo — stores in localStorage) ─────────── */
const USERS_KEY = 'decibel_users';
const SESSION_KEY = 'decibel_session';

function getUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '{}'); } catch { return {}; }
}
function saveUser(email, password) {
  const users = getUsers();
  users[email.toLowerCase()] = password;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}
function checkCredentials(email, password) {
  const users = getUsers();
  return users[email.toLowerCase()] === password;
}
export function saveSession(name, email) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ name, email, ts: Date.now() }));
}
export function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; }
}
export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

/* ── Social Button ─────────────────────────────────────────────────── */
function SocialBtn({ icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        padding: '10px 16px',
        borderRadius: '12px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        fontSize: '13px', fontWeight: 500,
        color: 'rgba(255,255,255,0.75)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

/* ── Input ─────────────────────────────────────────────────────────── */
function GlassInput({ label, type = 'text', value, onChange, placeholder, autoFocus, rightEl }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.05em' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoFocus={autoFocus}
          style={{
            width: '100%',
            padding: '13px 44px 13px 16px',
            borderRadius: '14px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff',
            fontSize: '14px',
            fontFamily: "'Inter', sans-serif",
            outline: 'none',
            transition: 'all 0.2s ease',
          }}
          onFocus={e => {
            e.target.style.borderColor = 'rgba(255,255,255,0.3)';
            e.target.style.background = 'rgba(255,255,255,0.07)';
          }}
          onBlur={e => {
            e.target.style.borderColor = 'rgba(255,255,255,0.1)';
            e.target.style.background = 'rgba(255,255,255,0.04)';
          }}
        />
        {rightEl && (
          <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)' }}>
            {rightEl}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Error / Success message ───────────────────────────────────────── */
function Alert({ type, children }) {
  const isError = type === 'error';
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        padding: '10px 14px',
        borderRadius: '10px',
        fontSize: '13px',
        background: isError ? 'rgba(252,60,68,0.12)' : 'rgba(29,185,84,0.12)',
        border: `1px solid ${isError ? 'rgba(252,60,68,0.25)' : 'rgba(29,185,84,0.25)'}`,
        color: isError ? '#fc3c44' : '#1db954',
      }}
    >
      {children}
    </motion.div>
  );
}

/* ── Main LoginPage ────────────────────────────────────────────────── */
export default function LoginPage({ onAuthenticated }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null); // { type, msg }

  const [otp, setOtp] = useState('');

  // Clear alert on mode switch between login and signup
  useEffect(() => {
    if (mode === 'login' || mode === 'signup') {
      setAlert(null);
      setEmail('');
      setPassword('');
      setName('');
      setOtp('');
    }
  }, [mode]);

  async function handleSubmit(e) {
    e.preventDefault();
    setAlert(null);

    if (!email.trim() || !password.trim()) {
      return setAlert({ type: 'error', msg: 'Please fill in all fields.' });
    }
    if (mode === 'signup' && password.length < 8) {
      return setAlert({ type: 'error', msg: 'Password must be at least 8 characters.' });
    }
    if (mode === 'login' && password.length < 6) {
      return setAlert({ type: 'error', msg: 'Password must be at least 6 characters.' });
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: {
              name: name.trim()
            }
          }
        });
        if (error) {
          setAlert({ type: 'error', msg: error.message || 'Registration failed.' });
        } else {
          if (data?.session) {
            const displayName = data.user.user_metadata?.name || email.split('@')[0];
            saveSession(displayName, email.trim());
            onAuthenticated({ name: displayName, email: email.trim(), email_verified: data.user.email_confirmed_at ? true : false });
          } else {
            setMode('otp');
            setAlert({ type: 'success', msg: 'Registration successful! Check your email for a verification code.' });
          }
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password
        });
        if (error) {
          setAlert({ type: 'error', msg: error.message || 'Invalid email or password.' });
        } else {
          const displayName = data.user?.user_metadata?.name || email.split('@')[0];
          saveSession(displayName, email.trim());
          onAuthenticated({ name: displayName, email: email.trim(), email_verified: data.user?.email_confirmed_at ? true : false });
        }
      }
    } catch (err) {
      setAlert({ type: 'error', msg: 'Server unreachable. Please check your network.' });
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpSubmit(e) {
    e.preventDefault();
    setAlert(null);

    if (otp.length < 6) {
      return setAlert({ type: 'error', msg: 'Please enter the 6-digit code.' });
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otp.trim(),
        type: 'signup'
      });
      if (error) {
        setAlert({ type: 'error', msg: error.message || 'Invalid code. Please try again.' });
      } else {
        const displayName = data.user?.user_metadata?.name || email.split('@')[0];
        saveSession(displayName, email.trim());
        onAuthenticated({ name: displayName, email: email.trim(), email_verified: true });
      }
    } catch (err) {
      setAlert({ type: 'error', msg: 'Verification failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  function continueAsGuest() {
    saveSession('Listener', 'guest@decibel.app');
    onAuthenticated({ name: 'Listener', email: 'guest@decibel.app' });
  }

  function handleSocial(provider) {
    const displayName = `${provider} User`;
    saveSession(displayName, `${provider.toLowerCase()}@decibel.app`);
    onAuthenticated({ name: displayName, email: `${provider.toLowerCase()}@decibel.app` });
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#000',
      fontFamily: "'Inter', sans-serif",
      overflow: 'hidden',
    }}>
      {/* Background video */}
      <BackgroundVideo />

      {/* Extra dark gradient overlay */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.75) 100%)',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '400px', padding: '24px' }}
      >
        {/* Card */}
        <div className="liquid-glass" style={{
          borderRadius: '28px',
          padding: '36px 32px 28px',
          display: 'flex', flexDirection: 'column', gap: '24px',
        }}>
          {/* Logo */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <Music2 size={22} color="#fff" />
            </div>
            <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '28px', color: '#fff', marginBottom: '4px' }}>
              Decibel
            </h1>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>
              {mode === 'otp'
                ? 'Verify your email'
                : mode === 'login'
                ? 'Welcome back'
                : 'Create your account'}
            </p>
          </div>

          {mode === 'otp' ? (
            <form onSubmit={handleOtpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <AnimatePresence mode="wait">
                {alert && (
                  <Alert key="alert" type={alert.type}>{alert.msg}</Alert>
                )}
              </AnimatePresence>

              <div style={{
                padding: '14px 16px', borderRadius: '14px',
                background: 'rgba(99,102,241,0.08)',
                border: '1px solid rgba(99,102,241,0.2)',
                fontSize: '13px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.5,
              }}>
                <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Demo mode:</strong> The verification code is{' '}
                <strong style={{ color: '#a5b4fc', letterSpacing: '0.1em' }}>123456</strong>
              </div>

              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, textAlign: 'center' }}>
                We sent a 6-digit code to <strong style={{ color: 'rgba(255,255,255,0.8)' }}>{email}</strong>
              </p>

              <GlassInput
                label="Verification Code"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                placeholder="123456"
                autoFocus
              />

              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '13px',
                  borderRadius: '14px',
                  background: loading ? 'rgba(255,255,255,0.6)' : '#fff',
                  color: '#000',
                  fontSize: '14px',
                  fontWeight: 600,
                  fontFamily: "'Inter', sans-serif",
                  cursor: loading ? 'not-allowed' : 'pointer',
                  border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  transition: 'all 0.2s ease',
                  marginTop: '4px',
                }}
              >
                {loading ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                ) : (
                  <>
                    Verify & Sign In
                    <ArrowRight size={16} />
                  </>
                )}
              </motion.button>

              <button
                type="button"
                onClick={() => setMode('login')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '12px', color: 'rgba(255,255,255,0.35)',
                  fontFamily: 'inherit', textAlign: 'center', marginTop: '8px',
                }}
              >
                ← Back to Sign In
              </button>
            </form>
          ) : (
            <>
              {/* Social buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <SocialBtn
                  label="Google"
                  icon={<Globe size={15} />}
                  onClick={() => handleSocial('Google')}
                />
                <SocialBtn
                  label="Spotify"
                  icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>}
                  onClick={() => handleSocial('Spotify')}
                />
                <SocialBtn
                  label="Apple"
                  icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.56-1.32 3.1-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>}
                  onClick={() => handleSocial('Apple')}
                />
              </div>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>or</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <AnimatePresence mode="wait">
                  {alert && (
                    <Alert key="alert" type={alert.type}>{alert.msg}</Alert>
                  )}
                </AnimatePresence>

                {mode === 'signup' && (
                  <GlassInput
                    label="Name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your name"
                    autoFocus
                  />
                )}

                <GlassInput
                  label="Email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoFocus={mode === 'login'}
                />

                <GlassInput
                  label="Password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  rightEl={
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      style={{ color: 'rgba(255,255,255,0.35)', display: 'flex', cursor: 'pointer', background: 'none', border: 'none' }}
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                />

                {/* Submit */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '13px',
                    borderRadius: '14px',
                    background: loading ? 'rgba(255,255,255,0.6)' : '#fff',
                    color: '#000',
                    fontSize: '14px',
                    fontWeight: 600,
                    fontFamily: "'Inter', sans-serif",
                    cursor: loading ? 'not-allowed' : 'pointer',
                    border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    transition: 'all 0.2s ease',
                    marginTop: '4px',
                  }}
                >
                  {loading ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                  ) : (
                    <>
                      {mode === 'login' ? 'Sign In' : 'Create Account'}
                      <ArrowRight size={16} />
                    </>
                  )}
                </motion.button>
              </form>

              {/* Mode toggle */}
              <div style={{ textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>
                {mode === 'login' ? (
                  <>Don't have an account?{' '}
                    <button onClick={() => setMode('signup')} style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                      Sign up
                    </button>
                  </>
                ) : (
                  <>Already have an account?{' '}
                    <button onClick={() => setMode('login')} style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                      Sign in
                    </button>
                  </>
                )}
              </div>

              {/* Guest access */}
              <button
                onClick={continueAsGuest}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '12px', color: 'rgba(255,255,255,0.25)',
                  fontFamily: 'inherit', textDecoration: 'underline',
                  textUnderlineOffset: '3px',
                }}
              >
                Continue as Guest →
              </button>
            </>
          )}
        </div>
      </motion.div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
