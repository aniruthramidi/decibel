import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ListMusic, Plus, Search, Trash2, ChevronRight, ChevronLeft,
  Music2, Video, AlertCircle, CheckCircle2, Loader2, X, Play
} from 'lucide-react';
import { ytPlaylists, searchYouTubeMusicTracks } from '../services/musicApi';

/* ── Tiny helpers ─────────────────────────────────────────────────────────── */
function fmt(secs) {
  if (!secs) return '--:--';
  const m = Math.floor(secs / 60);
  const s = String(Math.floor(secs % 60)).padStart(2, '0');
  return `${m}:${s}`;
}

/* ── Status / alert banner ────────────────────────────────────────────────── */
function StatusBanner({ status }) {
  if (!status) return null;
  const isError = status.type === 'error';
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '12px 16px', borderRadius: '14px',
        background: isError ? 'rgba(252,60,68,0.1)' : 'rgba(255,200,50,0.08)',
        border: `1px solid ${isError ? 'rgba(252,60,68,0.25)' : 'rgba(255,200,50,0.2)'}`,
        fontSize: '13px', fontWeight: 500,
        color: isError ? '#fc3c44' : 'rgba(255,200,50,0.9)',
      }}
    >
      {isError ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
      {status.msg}
    </motion.div>
  );
}

/* ── Empty state ──────────────────────────────────────────────────────────── */
function Empty({ icon: Icon, title, subtitle }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: '14px', flex: 1,
      color: 'rgba(255,255,255,0.2)', padding: '60px 0',
    }}>
      <Icon size={44} strokeWidth={1} />
      <div style={{ textAlign: 'center' }}>
        <h4 style={{ fontSize: '18px', fontFamily: "'Instrument Serif', serif", color: 'rgba(255,255,255,0.55)', marginBottom: '6px' }}>
          {title}
        </h4>
        <p style={{ fontSize: '13px' }}>{subtitle}</p>
      </div>
    </div>
  );
}

/* ── Playlist card ────────────────────────────────────────────────────────── */
function PlaylistCard({ pl, onOpen, onDelete, deleting }) {
  const thumbUrl = pl.thumbnails?.[0]?.url || null;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={onOpen}
      style={{
        display: 'flex', alignItems: 'center', gap: '14px',
        padding: '14px 16px', borderRadius: '16px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        cursor: 'pointer', transition: 'all 0.2s ease',
        marginBottom: '6px',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
      }}
    >
      {/* Thumbnail */}
      <div style={{
        width: 52, height: 52, borderRadius: 12, flexShrink: 0,
        background: 'rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {thumbUrl
          ? <img src={thumbUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <ListMusic size={22} color="rgba(255,255,255,0.35)" />
        }
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {pl.title}
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
          {pl.count != null ? `${pl.count} tracks` : 'YouTube Music Playlist'}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <button
          onClick={e => { e.stopPropagation(); onDelete(pl.playlistId); }}
          disabled={deleting}
          style={{
            padding: '6px', borderRadius: '8px',
            background: 'rgba(252,60,68,0.08)',
            border: '1px solid rgba(252,60,68,0.15)',
            color: '#fc3c44', display: 'flex',
            opacity: deleting ? 0.4 : 1,
            transition: 'all 0.2s',
          }}
        >
          {deleting ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={14} />}
        </button>
        <ChevronRight size={16} color="rgba(255,255,255,0.3)" />
      </div>
    </motion.div>
  );
}

/* ── Track search result row ──────────────────────────────────────────────── */
function TrackRow({ track, onAdd, adding }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '10px 14px', borderRadius: '12px',
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.05)',
      marginBottom: '6px',
      transition: 'all 0.2s',
    }}>
      <img
        src={track.cover || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=100'}
        alt=""
        style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 500, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {track.title}
        </div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
          {track.artist} • {fmt(track.duration)}
        </div>
      </div>
      <button
        onClick={() => onAdd(track)}
        disabled={adding === track.videoId}
        style={{
          padding: '6px 14px', borderRadius: '9999px',
          background: 'rgba(var(--theme-glow-rgb), 0.15)',
          border: '1px solid rgba(var(--theme-glow-rgb), 0.25)',
          color: 'rgb(var(--theme-glow-rgb))',
          fontSize: '12px', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: '5px',
          flexShrink: 0, transition: 'all 0.2s',
          opacity: adding === track.videoId ? 0.6 : 1,
        }}
      >
        {adding === track.videoId
          ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
          : <Plus size={12} />
        }
        Add
      </button>
    </div>
  );
}

/* ── Playlist detail view ─────────────────────────────────────────────────── */
function PlaylistDetail({ playlist, onBack, onPlayTrack }) {
  const [searchQ, setSearchQ] = useState('');
  const [searchRes, setSearchRes] = useState([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(null);
  const [tracks, setTracks] = useState(playlist.tracks || []);
  const [status, setStatus] = useState(null);

  const doSearch = async (e) => {
    e?.preventDefault();
    if (!searchQ.trim()) return;
    setSearching(true);
    try {
      const results = await searchYouTubeMusicTracks(searchQ);
      setSearchRes(results.slice(0, 15));
    } catch {
      setStatus({ type: 'error', msg: 'Search failed — is the backend running?' });
    } finally {
      setSearching(false);
    }
  };

  const addTrack = async (track) => {
    if (!track.videoId) return setStatus({ type: 'error', msg: 'No videoId for this track.' });
    setAdding(track.videoId);
    try {
      await ytPlaylists.addItems(playlist.playlistId, track);
      setTracks(prev => [track, ...prev]);
      setStatus({ type: 'success', msg: `"${track.title}" added to playlist!` });
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      setStatus({ type: 'error', msg: err.message || 'Failed to add track.' });
    } finally {
      setAdding(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button
          onClick={onBack}
          style={{
            padding: '8px', borderRadius: '10px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', color: 'rgba(255,255,255,0.7)',
          }}
        >
          <ChevronLeft size={18} />
        </button>
        <div>
          <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
            YouTube Music Playlist
          </div>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '24px', color: '#fff' }}>
            {playlist.title}
          </h2>
        </div>
      </div>

      <AnimatePresence>{status && <StatusBanner status={status} />}</AnimatePresence>

      <div style={{ display: 'flex', gap: '20px', flex: 1, flexWrap: 'wrap' }}>
        {/* Left: current tracks */}
        <div className="liquid-glass" style={{ flex: '1 1 340px', borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '300px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Music2 size={12} /> Tracks in Playlist ({tracks.length})
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {tracks.length === 0
              ? <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '13px', padding: '40px 0' }}>No tracks yet — search and add below.</div>
              : tracks.map((t, i) => (
                <div
                  key={`${t.videoId || t.id}-${i}`}
                  onClick={() => onPlayTrack && onPlayTrack(t)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '8px 10px', borderRadius: '10px', cursor: 'pointer',
                    marginBottom: '4px', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <img src={t.cover || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=100'} alt="" style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#fff' }}>{t.title}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{t.artist}</div>
                  </div>
                  <Play size={12} color="rgba(255,255,255,0.3)" />
                </div>
              ))
            }
          </div>
        </div>

        {/* Right: search & add */}
        <div className="liquid-glass" style={{ flex: '1 1 340px', borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Search size={12} /> Search &amp; Add Tracks
          </div>

          <form onSubmit={doSearch} style={{ display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={14} color="rgba(255,255,255,0.35)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Search YouTube Music…"
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                className="glass-input"
                style={{ width: '100%', paddingLeft: 40, fontSize: '13px' }}
              />
            </div>
            <button
              type="submit"
              className="btn-primary"
              style={{ flexShrink: 0, padding: '10px 18px', fontSize: '13px' }}
            >
              {searching ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 'Search'}
            </button>
          </form>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {searchRes.length === 0 && !searching && (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '13px', padding: '40px 0' }}>
                Search for songs to add to this playlist
              </div>
            )}
            {searching && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Loader2 size={24} color="rgba(255,255,255,0.3)" style={{ animation: 'spin 1s linear infinite' }} />
              </div>
            )}
            {!searching && searchRes.map(track => (
              <TrackRow key={track.id || track.videoId} track={track} onAdd={addTrack} adding={adding} />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Create playlist modal ────────────────────────────────────────────────── */
function CreateModal({ onCreate, onClose }) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return setErr('Please enter a playlist title.');
    setLoading(true);
    setErr('');
    try {
      await onCreate(title.trim(), desc.trim());
    } catch (ex) {
      setErr(ex.message || 'Failed to create playlist.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.93, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.93, y: 20 }}
        className="liquid-glass"
        style={{ width: '100%', maxWidth: '420px', margin: '24px', borderRadius: '24px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '22px', color: '#fff' }}>
            New Playlist
          </h3>
          <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.4)', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        {err && (
          <div style={{ padding: '10px 14px', borderRadius: '10px', fontSize: '13px', background: 'rgba(252,60,68,0.12)', border: '1px solid rgba(252,60,68,0.25)', color: '#fc3c44' }}>
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.45)' }}>
              Playlist Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="My Awesome Playlist"
              autoFocus
              className="glass-input"
              style={{ width: '100%', borderRadius: '14px' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.45)' }}>
              Description
            </label>
            <input
              type="text"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="Optional description…"
              className="glass-input"
              style={{ width: '100%', borderRadius: '14px' }}
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '13px', borderRadius: '14px',
              background: loading ? 'rgba(255,255,255,0.6)' : '#fff',
              color: '#000', fontSize: '14px', fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'all 0.2s ease',
            }}
          >
            {loading
              ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Creating…</>
              : <><Plus size={16} /> Create Playlist</>
            }
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
}

/* ── Main YTPlaylists tab ─────────────────────────────────────────────────── */
export default function YTPlaylists({ onPlayTrack }) {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [openPlaylist, setOpenPlaylist] = useState(null); // full playlist object with tracks
  const [deletingId, setDeletingId] = useState(null);
  const [authMode, setAuthMode] = useState('unknown');

  // Check backend status
  useEffect(() => {
    fetch('/api/status')
      .then(r => r.json())
      .then(d => setAuthMode(d.auth || 'guest'))
      .catch(() => setAuthMode('offline'));
  }, []);

  const loadPlaylists = useCallback(async () => {
    setLoading(true);
    setStatus(null);
    try {
      const data = await ytPlaylists.list();
      setPlaylists(data.playlists || []);
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('OAuth') || msg.includes('401')) {
        setStatus({ type: 'error', msg: 'OAuth required — run: cd server && ytmusicapi oauth  (creates oauth.json)' });
      } else if (msg.includes('fetch')) {
        setStatus({ type: 'error', msg: 'Backend offline — run: cd decibel-web/server && python main.py' });
      } else {
        setStatus({ type: 'error', msg: msg });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPlaylists(); }, [loadPlaylists]);

  const handleCreate = async (title, description) => {
    const result = await ytPlaylists.create(title, description);
    setShowCreate(false);
    setStatus({ type: 'success', msg: `Playlist "${result.title}" created!` });
    setTimeout(() => setStatus(null), 3000);
    loadPlaylists();
  };

  const handleDelete = async (playlistId) => {
    if (!window.confirm('Delete this playlist from YouTube Music?')) return;
    setDeletingId(playlistId);
    try {
      await ytPlaylists.delete(playlistId);
      setPlaylists(prev => prev.filter(p => p.playlistId !== playlistId));
      setStatus({ type: 'success', msg: 'Playlist deleted.' });
      setTimeout(() => setStatus(null), 2500);
    } catch (err) {
      setStatus({ type: 'error', msg: err.message || 'Delete failed.' });
    } finally {
      setDeletingId(null);
    }
  };

  const openPlaylistDetail = async (pl) => {
    try {
      const detail = await ytPlaylists.getPlaylist(pl.playlistId);
      setOpenPlaylist({ ...pl, ...detail });
    } catch {
      setOpenPlaylist({ ...pl, tracks: [] });
    }
  };

  // ── Detail view
  if (openPlaylist) {
    return (
      <AnimatePresence mode="wait">
        <PlaylistDetail
          key={openPlaylist.playlistId}
          playlist={openPlaylist}
          onBack={() => setOpenPlaylist(null)}
          onPlayTrack={onPlayTrack}
        />
      </AnimatePresence>
    );
  }

  // ── List view
  return (
    <motion.div
      key="yt-playlists"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Video size={12} />
            YouTube Music
          </p>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '38px', fontWeight: 400, color: '#fff', lineHeight: 1.1 }}>
            My Playlists
          </h1>
        </div>

        {/* Auth mode badge + create button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            padding: '5px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600,
            background: authMode !== 'offline' ? 'rgba(29,185,84,0.1)' : 'rgba(252,60,68,0.1)',
            border: `1px solid ${authMode !== 'offline' ? 'rgba(29,185,84,0.25)' : 'rgba(252,60,68,0.25)'}`,
            color: authMode !== 'offline' ? '#1db954' : '#fc3c44',
            display: 'flex', alignItems: 'center', gap: '5px',
          }}>
            {authMode !== 'offline' ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
            {authMode !== 'offline' ? 'Database Synced' : 'Backend Offline'}
          </div>

          <button
            onClick={() => setShowCreate(true)}
            disabled={authMode === 'offline'}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '9px 18px', borderRadius: '9999px',
              background: authMode !== 'offline' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.06)',
              color: authMode !== 'offline' ? '#000' : 'rgba(255,255,255,0.3)',
              fontSize: '13px', fontWeight: 600,
              cursor: authMode !== 'offline' ? 'pointer' : 'not-allowed',
              border: '1px solid rgba(255,255,255,0.1)',
              transition: 'all 0.2s',
            }}
          >
            <Plus size={14} /> New Playlist
          </button>
        </div>
      </div>

      <AnimatePresence>{status && <StatusBanner status={status} />}</AnimatePresence>

      {/* Setup hint when backend is offline */}
      {authMode === 'offline' && (
        <div className="liquid-glass" style={{ borderRadius: '16px', padding: '18px 22px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          <AlertCircle size={18} color="#fc3c44" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '6px' }}>
              Backend Connection Offline
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
              The React frontend is unable to connect to the FastAPI Python server. Please ensure the backend is running.
            </div>
          </div>
        </div>
      )}

      {/* Playlist list */}
      <div className="liquid-glass" style={{ borderRadius: '20px', padding: '20px 24px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ListMusic size={13} /> Your Playlists
          {!loading && <span style={{ marginLeft: 'auto', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
            {playlists.length} playlist{playlists.length !== 1 ? 's' : ''}
          </span>}
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '10px', color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>
            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
            Loading playlists…
          </div>
        ) : playlists.length === 0 ? (
          <Empty icon={ListMusic} title="No Playlists Yet" subtitle={authMode === 'oauth' ? 'Create your first YouTube Music playlist above.' : 'Connect OAuth to manage playlists.'} />
        ) : (
          <div style={{ overflowY: 'auto', flex: 1 }}>
            <AnimatePresence>
              {playlists.map(pl => (
                <PlaylistCard
                  key={pl.playlistId}
                  pl={pl}
                  onOpen={() => openPlaylistDetail(pl)}
                  onDelete={handleDelete}
                  deleting={deletingId === pl.playlistId}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <CreateModal onCreate={handleCreate} onClose={() => setShowCreate(false)} />
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  );
}
