import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User, Mail, Shield, CheckCircle2, AlertCircle, Music2, Clock, Heart,
  LogOut, Edit2, X, Send, RefreshCw, Eye, EyeOff, Lock,
} from 'lucide-react';

const API = 'http://localhost:8000';

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div style={{
      flex: 1, minWidth: '120px',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '16px',
      padding: '16px 18px',
      display: 'flex', flexDirection: 'column', gap: '8px',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: '10px',
        background: `rgba(${color},0.12)`,
        border: `1px solid rgba(${color},0.2)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={15} color={`rgb(${color})`} />
      </div>
      <div>
        <div style={{ fontSize: '22px', fontWeight: 700, color: '#fff', lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px', fontWeight: 500 }}>{label}</div>
      </div>
    </div>
  );
}

function OtpModal({ email, onClose, onVerified }) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function sendOtp() {
    setLoading(true);
    setError('');
    // Simulate sending email - backend stores OTP
    await new Promise(r => setTimeout(r, 800));
    setSent(true);
    setLoading(false);
    // For demo: show the code is 123456
  }

  async function verifyOtp() {
    if (otp.length < 6) return setError('Please enter the 6-digit code.');
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otp }),
      });
      const data = await res.json();
      if (res.ok) {
        onVerified();
      } else {
        setError(data.detail || 'Invalid code. Please try again.');
      }
    } catch {
      setError('Server unreachable. Please check your backend.');
    }
    setLoading(false);
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.25 }}
        className="liquid-glass"
        style={{
          borderRadius: '24px',
          padding: '32px 28px',
          width: '100%',
          maxWidth: '380px',
          display: 'flex', flexDirection: 'column', gap: '20px',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '22px', color: '#fff' }}>
            Verify Email
          </h2>
          <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.4)', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{
          padding: '14px 16px', borderRadius: '14px',
          background: 'rgba(99,102,241,0.08)',
          border: '1px solid rgba(99,102,241,0.2)',
          fontSize: '13px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.5,
        }}>
          <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Demo mode:</strong> The verification code is{' '}
          <strong style={{ color: '#a5b4fc', letterSpacing: '0.1em' }}>123456</strong>
        </div>

        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
          We'll send a 6-digit code to <strong style={{ color: 'rgba(255,255,255,0.8)' }}>{email}</strong>
        </p>

        {!sent ? (
          <button
            onClick={sendOtp}
            disabled={loading}
            style={{
              padding: '13px',
              borderRadius: '14px',
              background: loading ? 'rgba(255,255,255,0.6)' : '#fff',
              color: '#000', fontWeight: 600, fontSize: '14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
            {loading ? 'Sending…' : 'Send Code'}
          </button>
        ) : (
          <>
            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: '10px', fontSize: '13px',
                background: 'rgba(252,60,68,0.1)', border: '1px solid rgba(252,60,68,0.2)',
                color: '#fc3c44', display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <AlertCircle size={13} /> {error}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>
                Verification Code
              </label>
              <input
                type="text"
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                onKeyDown={e => e.key === 'Enter' && verifyOtp()}
                autoFocus
                style={{
                  padding: '13px 16px',
                  borderRadius: '14px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#fff', fontSize: '20px', fontWeight: 700,
                  letterSpacing: '0.3em', textAlign: 'center',
                  outline: 'none', fontFamily: 'monospace',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={sendOtp}
                style={{
                  flex: 1, padding: '11px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: 500,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                }}
              >
                <RefreshCw size={13} /> Resend
              </button>
              <button
                onClick={verifyOtp}
                disabled={loading || otp.length < 6}
                style={{
                  flex: 2, padding: '11px',
                  borderRadius: '12px',
                  background: otp.length === 6 ? '#fff' : 'rgba(255,255,255,0.3)',
                  color: '#000', fontSize: '13px', fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  cursor: otp.length === 6 ? 'pointer' : 'not-allowed',
                }}
              >
                {loading ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={13} />}
                Verify
              </button>
            </div>
          </>
        )}
      </motion.div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function AccountTab({ session, onLogout, libraryTracks, currentTrack }) {
  const [emailVerified, setEmailVerified] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [checkingVerified, setCheckingVerified] = useState(true);

  useEffect(() => {
    if (!session?.email || session.email === 'guest@decibel.app') {
      setCheckingVerified(false);
      return;
    }
    // Check if email is verified by logging in
    fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: session.email, password: '_check_' }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.email_verified !== undefined) setEmailVerified(data.email_verified);
      })
      .catch(() => {})
      .finally(() => setCheckingVerified(false));
  }, [session?.email]);

  const isGuest = session?.email === 'guest@decibel.app';
  const initial = session?.name?.[0]?.toUpperCase() || '?';
  const tracksPlayed = parseInt(localStorage.getItem('decibel_tracks_played') || '0', 10);

  return (
    <motion.div
      key="account"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: '8px' }}>
          Your Profile
        </p>
        <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '38px', fontWeight: 400, color: '#fff', lineHeight: 1.1 }}>
          Account
        </h1>
      </div>

      {/* Profile Card */}
      <div className="liquid-glass" style={{ borderRadius: '24px', padding: '28px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
          {/* Avatar */}
          <div style={{
            width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(168,85,247,0.3))',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '28px', fontWeight: 700, color: '#fff',
          }}>
            {initial}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <h2 style={{ fontSize: '22px', fontFamily: "'Instrument Serif', serif", color: '#fff', marginBottom: '4px' }}>
              {session?.name || 'Listener'}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)' }}>
                {session?.email}
              </span>
              {!isGuest && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  padding: '2px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600,
                  background: emailVerified ? 'rgba(29,185,84,0.12)' : 'rgba(255,170,0,0.1)',
                  border: `1px solid ${emailVerified ? 'rgba(29,185,84,0.25)' : 'rgba(255,170,0,0.2)'}`,
                  color: emailVerified ? '#1db954' : '#ffaa00',
                }}>
                  {emailVerified ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                  {emailVerified ? 'Verified' : 'Unverified'}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: '9999px', fontSize: '12px', fontWeight: 500,
              background: 'rgba(252,60,68,0.08)', border: '1px solid rgba(252,60,68,0.15)',
              color: '#fc3c44', cursor: 'pointer', transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(252,60,68,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(252,60,68,0.08)'}
          >
            <LogOut size={12} /> Sign Out
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <StatCard icon={Heart} label="Saved Tracks" value={libraryTracks?.length || 0} color="252,60,68" />
          <StatCard icon={Music2} label="Songs Played" value={tracksPlayed} color="99,102,241" />
          <StatCard icon={Clock} label="Hours Listened" value={Math.round(tracksPlayed * 3.5 / 60)} color="168,85,247" />
        </div>
      </div>

      {/* Email Verification */}
      {!isGuest && (
        <div className="liquid-glass" style={{ borderRadius: '20px', padding: '24px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Shield size={15} color={emailVerified ? '#1db954' : '#ffaa00'} />
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>Email Verification</h3>
              </div>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                {emailVerified
                  ? 'Your email is verified. Your account is fully secured.'
                  : 'Verify your email to secure your account and enable all features.'}
              </p>
            </div>
            {!emailVerified && (
              <button
                onClick={() => setShowOtpModal(true)}
                style={{
                  flexShrink: 0, marginLeft: '20px',
                  padding: '9px 20px', borderRadius: '9999px', fontSize: '13px', fontWeight: 600,
                  background: 'rgba(99,102,241,0.15)',
                  border: '1px solid rgba(99,102,241,0.3)',
                  color: '#a5b4fc', cursor: 'pointer', transition: 'all 0.2s ease',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.25)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.15)'}
              >
                <Mail size={13} /> Verify Now
              </button>
            )}
            {emailVerified && (
              <div style={{
                padding: '9px 16px', borderRadius: '9999px',
                background: 'rgba(29,185,84,0.1)',
                border: '1px solid rgba(29,185,84,0.2)',
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '13px', fontWeight: 600, color: '#1db954',
              }}>
                <CheckCircle2 size={14} /> Verified
              </div>
            )}
          </div>
        </div>
      )}

      {/* Currently Playing */}
      {currentTrack && (
        <div className="liquid-glass" style={{ borderRadius: '20px', padding: '20px 24px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Music2 size={12} /> Now Playing
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img
              src={currentTrack.cover}
              alt=""
              style={{ width: 52, height: 52, borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }}
            />
            <div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff', marginBottom: '3px' }}>{currentTrack.title}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>{currentTrack.artist}</div>
            </div>
          </div>
        </div>
      )}

      {/* Security Info */}
      <div className="liquid-glass" style={{ borderRadius: '20px', padding: '24px 28px' }}>
        <h3 style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Lock size={12} /> Security
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { label: 'Password', value: 'Last changed: Today', status: 'ok' },
            { label: 'Two-factor auth', value: 'Not enabled (coming soon)', status: 'warn' },
            { label: 'Active sessions', value: '1 session (this device)', status: 'ok' },
          ].map(item => (
            <div key={item.label} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px', borderRadius: '12px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>{item.label}</span>
              <span style={{
                fontSize: '12px',
                color: item.status === 'ok' ? 'rgba(255,255,255,0.4)' : '#ffaa00',
              }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* OTP Modal */}
      <AnimatePresence>
        {showOtpModal && (
          <OtpModal
            email={session?.email}
            onClose={() => setShowOtpModal(false)}
            onVerified={() => {
              setEmailVerified(true);
              setShowOtpModal(false);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
