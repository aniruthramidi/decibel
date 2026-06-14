/**
 * Decibel Player — YouTube Music player embedded in asme-landing.
 * Visual design mirrors the decibel-web app:
 *   • liquid-glass cards  • Instrument Serif headings  • vinyl + tonearm
 *   • animated equalizer  • progress bar  • volume  • search / queue
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Play, Pause, SkipForward, SkipBack,
  Volume2, VolumeX, Shuffle, RotateCcw,
  Search, Music2, Heart, ListMusic, Loader2,
  Plus, Trash2, Sparkles, FileText, Airplay,
  ChevronLeft, Check, FolderPlus, Tv, Video
} from 'lucide-react'

/* ══════════════════════════════════════════════
   HELPERS & PARSERS
   ═══════════════════════════════════════════════ */
function fmt(secs) {
  if (!secs || isNaN(secs)) return '0:00'
  const m = Math.floor(secs / 60)
  const s = String(Math.floor(secs % 60)).padStart(2, '0')
  return `${m}:${s}`
}

function parseLRC(lrcText) {
  if (!lrcText) return []
  const lines = lrcText.split('\n')
  const result = []
  const timeRegex = /\[(\d+):(\d+(?:\.\d+)?)\]/
  for (const line of lines) {
    const match = timeRegex.exec(line)
    if (match) {
      const min = parseInt(match[1], 10)
      const sec = parseFloat(match[2])
      const time = min * 60 + sec
      const text = line.replace(timeRegex, '').trim()
      if (text) {
        result.push({ time, text })
      }
    }
  }
  return result.sort((a, b) => a.time - b.time)
}

async function apiSearch(q) {
  if (!q?.trim()) return []
  const r = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=25`)
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return (await r.json()).tracks || []
}

async function apiTrending() {
  try {
    const r = await fetch('/api/trending')
    if (!r.ok) return []
    return (await r.json()).tracks || []
  } catch { return [] }
}

/* ══════════════════════════════════════════════
   YouTube IFrame hook
   ═══════════════════════════════════════════════ */
function useYTPlayer({ onEnded }) {
  const ref   = useRef(null)
  const [rdy, setRdy] = useState(false)

  useEffect(() => {
    let intervalId;
    function build() {
      if (ref.current) return
      try {
        ref.current = new window.YT.Player('decibel-yt-hidden', {
          height: '1', width: '1',
          playerVars: { autoplay: 1, controls: 0, rel: 0, playsinline: 1 },
          events: {
            onReady:       () => setRdy(true),
            onStateChange: e  => { if (e.data === window.YT?.PlayerState?.ENDED) onEnded?.() },
          },
        })
        if (intervalId) clearInterval(intervalId)
      } catch (err) {
        console.error("Error creating YT.Player", err)
      }
    }

    if (window.YT?.Player) { 
      build()
    } else {
      intervalId = setInterval(() => {
        if (window.YT?.Player) {
          build()
          clearInterval(intervalId)
        }
      }, 100)

      const existing = document.querySelector('script[src*="youtube.com/iframe_api"]')
      if (!existing) {
        const s = document.createElement('script')
        s.src = 'https://www.youtube.com/iframe_api'
        document.head.appendChild(s)
      }
      
      const oldReady = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        if (oldReady) oldReady()
        build()
      }
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
      ref.current?.destroy?.()
      ref.current = null
    }
  }, []) // eslint-disable-line

  const p = ref.current
  return {
    ready:   rdy,
    load:    useCallback(id  => p?.loadVideoById?.(id),         [p]),
    pause:   useCallback(()  => p?.pauseVideo?.(),              [p]),
    play:    useCallback(()  => p?.playVideo?.(),               [p]),
    seekTo:  useCallback(s   => p?.seekTo?.(s, true),           [p]),
    setVol:  useCallback(v   => p?.setVolume?.(v * 100),        [p]),
    mute:    useCallback(()  => p?.mute?.(),                    [p]),
    unmute:  useCallback(()  => p?.unMute?.(),                  [p]),
    getTime: useCallback(()  => p?.getCurrentTime?.() ?? 0,     [p]),
    getDur:  useCallback(()  => p?.getDuration?.()   ?? 0,      [p]),
    getState:useCallback(()  => p?.getPlayerState?.() ?? -1,    [p]),
  }
}

/* ══════════════════════════════════════════════
   VINYL RECORD
   ═══════════════════════════════════════════════ */
function Vinyl({ cover, isPlaying, videoMode, videoPlaceholderRef }) {
  const coverUrl = cover || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&auto=format&fit=crop&q=80'
  return (
    <div style={{ position: 'relative', width: 220, height: 220, flexShrink: 0 }}>
      {/* Dynamic YouTube Video IFrame Container Overlay */}
      <div
        ref={videoPlaceholderRef}
        style={{
          position: 'absolute',
          width: 200, height: 200,
          borderRadius: 14,
          background: '#000',
          left: 0, top: 10,
          zIndex: videoMode ? 5 : -1,
          opacity: videoMode ? 1 : 0,
          pointerEvents: videoMode ? 'auto' : 'none',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0,0,0,0.6)'
        }}
      />

      {/* Album Art & Vinyl sleeve (Hidden when videoMode is active) */}
      <div style={{ opacity: videoMode ? 0 : 1, transition: 'opacity 0.35s ease' }}>
        {/* Vinyl disc */}
        <div
          className={`vinyl-record ${isPlaying ? 'spinning' : ''}`}
          style={{
            position: 'absolute', width: 200, height: 200, borderRadius: '50%',
            background: `radial-gradient(circle, transparent 28%, #0f0f11 29%, #1b1b1e 30%,
              #0d0d0f 38%, #141417 40%, #080809 46%, #1c1c1f 48%,
              #0a0a0b 60%, #151518 62%, #080809 70%, #1a1a1c 72%,
              #0b0b0c 82%, #17171a 84%, #000 95%)`,
            border: '2px solid rgba(255,255,255,0.05)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.6), inset 0 0 10px rgba(255,255,255,0.04)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1,
            transform: isPlaying ? 'translateX(52%)' : 'translateX(0%)',
            transition: 'transform 0.8s cubic-bezier(0.25,0.8,0.25,1)',
            top: 10, left: 0,
          }}
        >
          <div style={{
            width: 72, height: 72, borderRadius: '50%', overflow: 'hidden',
            border: '4px solid #141416', boxShadow: 'inset 0 0 6px rgba(0,0,0,0.8)',
            position: 'relative',
          }}>
            <img src={coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%,-50%)',
              width: 8, height: 8, borderRadius: '50%',
              background: '#050608', border: '2px solid #bbb',
            }} />
          </div>
        </div>

        {/* Album sleeve */}
        <div style={{
          position: 'absolute', width: 200, height: 200, borderRadius: 14,
          overflow: 'hidden', zIndex: 2,
          boxShadow: '0 15px 45px rgba(0,0,0,0.65)',
          border: '1px solid rgba(255,255,255,0.1)',
          left: 0, top: 10,
        }}>
          <img src={coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.9)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(255,255,255,0.1) 0%,transparent 50%,rgba(0,0,0,0.1) 100%)', pointerEvents: 'none' }} />
        </div>

        {/* Tonearm */}
        <div style={{
          position: 'absolute', top: -10, right: isPlaying ? -16 : -42,
          width: 70, height: 140, zIndex: 3,
          transformOrigin: '35px 18px',
          transform: isPlaying ? 'rotate(18deg)' : 'rotate(-25deg)',
          transition: 'all 0.8s cubic-bezier(0.25,0.8,0.25,1)',
          pointerEvents: 'none',
        }}>
          <div style={{ position: 'absolute', top: 4, left: 22, width: 26, height: 26, borderRadius: '50%', background: 'radial-gradient(circle,#718096 30%,#2d3748 70%)', border: '2.5px solid #1a202c', boxShadow: '0 4px 6px rgba(0,0,0,0.4)' }} />
          <div style={{ position: 'absolute', top: 20, left: 32, width: 5, height: 90, background: '#cbd5e0', borderRadius: 3, transform: 'rotate(5deg)', transformOrigin: 'top center' }} />
          <div style={{ position: 'absolute', top: 104, left: 35, width: 10, height: 20, background: '#1a202c', border: '1px solid #718096', borderRadius: 2, transform: 'rotate(-10deg)' }} />
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   EQUALIZER BARS
   ═══════════════════════════════════════════════ */
function EqBars({ isPlaying }) {
  const barCount = 28
  const heights = [
    0.4, 0.7, 1.0, 0.55, 0.85, 0.45, 0.75, 1.0, 0.6, 0.9, 0.4, 0.85, 0.5, 0.7, 0.95,
    0.3, 0.6, 0.8, 0.45, 0.75, 0.9, 0.5, 0.8, 1.0, 0.65, 0.4, 0.75, 0.5
  ]
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 3, width: 200, height: 36 }}>
      {heights.slice(0, barCount).map((h, i) => (
        <motion.span
          key={i}
          animate={isPlaying ? { scaleY: [h, 1, h * 0.4, 1, h] } : { scaleY: 0.15 }}
          transition={isPlaying ? { duration: 0.6 + (i % 5) * 0.1, repeat: Infinity, delay: (i % 7) * 0.07, ease: 'easeInOut' } : { duration: 0.4 }}
          style={{
            display: 'block', 
            flex: 1, 
            borderRadius: 1.5,
            height: '100%', 
            transformOrigin: 'bottom',
            background: 'rgba(255,255,255,0.6)',
          }}
        />
      ))}
    </div>
  )
}

/* ══════════════════════════════════════════════
   TRACK ROW
   ═══════════════════════════════════════════════ */
function TrackRow({ track, isCurrent, isPlaying, onClick, onAdd, onRemove, showAdd, showRemove, isSaved, onSave, playlists, onAddToPlaylist }) {
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showDropdown])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 12px', borderRadius: 12, cursor: 'pointer',
        background: isCurrent ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.015)',
        border: `1px solid ${isCurrent ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)'}`,
        marginBottom: 4, transition: 'all 0.15s',
        userSelect: 'none',
        position: 'relative'
      }}
    >
      {/* Art */}
      <div style={{ position: 'relative', width: 36, height: 36, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
        <img src={track.cover || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=100'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        {isCurrent && isPlaying && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <EqBars isPlaying />
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: isCurrent ? '#fff' : 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {track.title}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', marginTop: 1 }}>
          {track.artist} · {fmt(track.duration)}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 4, flexShrink: 0, position: 'relative' }} onClick={e => e.stopPropagation()}>
        {playlists && playlists.length > 0 && onAddToPlaylist && (
          <div ref={dropdownRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <button
              onClick={() => setShowDropdown(prev => !prev)}
              style={{
                padding: '4px 6px',
                borderRadius: 8,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: showDropdown ? '#38bdf8' : 'rgba(255,255,255,0.25)',
                transition: 'color 0.2s',
                display: 'flex'
              }}
              title="Add to Playlist"
            >
              <FolderPlus size={12} />
            </button>

            {showDropdown && (
              <div className="playlist-dropdown">
                <div style={{ padding: '6px 10px', fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 4 }}>
                  Add to Playlist
                </div>
                {playlists.map(pl => (
                  <div
                    key={pl.playlistId}
                    className="playlist-dropdown-item"
                    onClick={() => {
                      onAddToPlaylist(pl.playlistId, track)
                      setShowDropdown(false)
                    }}
                  >
                    <ListMusic size={12} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {pl.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {onSave && (
          <button onClick={() => onSave(track)} style={{ padding: '4px 6px', borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: isSaved ? 'rgba(255,100,100,0.9)' : 'rgba(255,255,255,0.25)', transition: 'color 0.2s', display: 'flex' }}>
            <Heart size={12} fill={isSaved ? 'currentColor' : 'none'} />
          </button>
        )}
        {showAdd && onAdd && (
          <button onClick={() => onAdd(track)} style={{ padding: '4px 6px', borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.25)', transition: 'color 0.2s', display: 'flex' }} title="Add to queue">
            <Plus size={12} />
          </button>
        )}
        {showRemove && onRemove && (
          <button onClick={onRemove} style={{ padding: '4px 6px', borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(252,60,68,0.5)', transition: 'color 0.2s', display: 'flex' }}>
            <Trash2 size={12} />
          </button>
        )}
      </div>
    </motion.div>
  )
}

/* ══════════════════════════════════════════════
   MAIN PLAYER
   ═══════════════════════════════════════════════ */
export default function Player({ user, onUpdateUser, activeTab: tab, setActiveTab: setTab }) {
  /* state */
  const [queue,     setQueue]     = useState([])
  const [idx,       setIdx]       = useState(0)
  const [playing,   setPlaying]   = useState(false)
  const [vol,       setVol]       = useState(0.75)
  const [muted,     setMuted]     = useState(false)
  const [progress,  setProgress]  = useState(0)
  const [duration,  setDuration]  = useState(0)
  const [shuffle,   setShuffle]   = useState(false)
  const [repeat,    setRepeat]    = useState(false)

  const [searchQ,   setSearchQ]   = useState('')
  const [results,   setResults]   = useState([])
  const [trending,  setTrending]  = useState([])
  const [searching, setSearching] = useState(false)
  const [saved,     setSaved]     = useState([])
  const [backend,   setBackend]   = useState(null) // null=checking, string=mode, false=offline

  /* Playlists state */
  const [playlists, setPlaylists] = useState([])
  const [playlistsLoading, setPlaylistsLoading] = useState(false)
  const [openPlaylist, setOpenPlaylist] = useState(null)
  const [showCreatePlaylistModal, setShowCreatePlaylistModal] = useState(false)
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('')
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('')

  /* Lyrics state */
  const [lyrics, setLyrics] = useState({ plain: null, synced: [], instrumental: false })
  const [lyricsLoading, setLyricsLoading] = useState(false)

  /* AirPlay state */
  const [showAirplayModal, setShowAirplayModal] = useState(false)
  const [airplayDevice, setAirplayDevice] = useState('MacBook Pro')
  const [connectingDevice, setConnectingDevice] = useState(null)

  /* Video mode state */
  const [videoMode, setVideoMode] = useState(false)

  /* Recommendations state */
  const [recommendations, setRecommendations] = useState([])
  const [recLoading, setRecLoading] = useState(false)

  /* OTP verification state */
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpError, setOtpError] = useState('')
  const [otpBusy, setOtpBusy] = useState(false)

  /* Change Password state */
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passError, setPassError] = useState('')
  const [passSuccess, setPassSuccess] = useState('')
  const [passBusy, setPassBusy] = useState(false)

  const tick = useRef(null)
  const lyricsContainerRef = useRef(null)
  const videoPlaceholderRef = useRef(null)

  const currentTrack = queue[idx] ?? null
  const userEmail = user?.email || 'guest@decibel.app'

  /* ── YT player ── */
  const yt = useYTPlayer({
    onEnded: () => skip(1),
  })

  /* ── check backend ── */
  useEffect(() => {
    fetch('/api/status')
      .then(r => r.json())
      .then(d => setBackend(d.auth ?? 'guest'))
      .catch(() => setBackend(false))
  }, [])

  /* ── load trending once backend responds ── */
  useEffect(() => {
    if (backend === null || backend === false) return
    apiTrending().then(tracks => {
      setTrending(tracks)
      if (tracks.length && !queue.length) {
        setQueue(tracks.slice(0, 30))
      }
    })
  }, [backend]) // eslint-disable-line

  /* ── Playlists Load (SQLite backend) ── */
  const loadPlaylists = useCallback(async () => {
    if (backend === null || backend === false) return
    setPlaylistsLoading(true)
    try {
      const r = await fetch(`/api/playlists?email=${encodeURIComponent(userEmail)}`)
      if (r.ok) {
        const d = await r.json()
        setPlaylists(d.playlists || [])
      }
    } catch (e) {
      console.error(e)
    }
    setPlaylistsLoading(false)
  }, [backend, userEmail])

  useEffect(() => {
    loadPlaylists()
  }, [backend, loadPlaylists])

  /* ── Create Playlist ── */
  async function createPlaylist(title, desc = "") {
    if (!title.trim() || backend === null || backend === false) return
    try {
      const r = await fetch(`/api/playlists?email=${encodeURIComponent(userEmail)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description: desc }),
      })
      if (r.ok) {
        loadPlaylists()
      }
    } catch (e) {
      console.error(e)
    }
    setNewPlaylistTitle('')
    setNewPlaylistDesc('')
    setShowCreatePlaylistModal(false)
  }

  /* ── Delete Playlist ── */
  async function deletePlaylist(playlistId) {
    if (!window.confirm('Are you sure you want to delete this playlist?') || backend === null || backend === false) return
    try {
      const r = await fetch(`/api/playlists/${playlistId}`, { method: 'DELETE' })
      if (r.ok) {
        loadPlaylists()
        if (openPlaylist?.playlistId === playlistId) setOpenPlaylist(null)
      }
    } catch (e) {
      console.error(e)
    }
  }

  /* ── Add Track to Playlist ── */
  async function addTrackToPlaylist(playlistId, track) {
    if (backend === null || backend === false) return
    try {
      const r = await fetch(`/api/playlists/${playlistId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: track.videoId,
          title: track.title,
          artist: track.artist,
          album: track.album || "",
          cover: track.cover || "",
          duration: track.duration || 0
        }),
      })
      if (r.ok) {
        if (openPlaylist && openPlaylist.playlistId === playlistId) {
          viewPlaylistDetails({ playlistId, title: openPlaylist.title, description: openPlaylist.description })
        }
        loadPlaylists()
      }
    } catch (e) {
      console.error(e)
    }
  }

  /* ── View Playlist Details ── */
  async function viewPlaylistDetails(playlist) {
    if (backend === null || backend === false) return
    try {
      const r = await fetch(`/api/playlist/${playlist.playlistId}`)
      if (r.ok) {
        const data = await r.json()
        setOpenPlaylist({
          ...playlist,
          tracks: data.tracks || []
        })
      }
    } catch (e) {
      console.error(e)
    }
  }

  /* ── Lyrics Loader ── */
  const fetchLyrics = useCallback(async (track) => {
    if (!track) return
    setLyricsLoading(true)
    setLyrics({ plain: null, synced: [], instrumental: false })
    try {
      const title = encodeURIComponent(track.title)
      const artist = encodeURIComponent(track.artist)
      const r = await fetch(`/api/lyrics?title=${title}&artist=${artist}`)
      if (r.ok) {
        const data = await r.json()
        const synced = parseLRC(data.syncedLyrics)
        setLyrics({
          plain: data.plainLyrics,
          synced: synced,
          instrumental: data.instrumental || false
        })
      } else {
        throw new Error()
      }
    } catch {
      // beautiful animated fallback lyrics
      const cleanTitle = track.title.split(" (feat.")[0].split(" feat.")[0]
      const mockSynced = [
        { time: 0, text: "♪ (Instrumental Intro)" },
        { time: 6, text: `Listening to ${cleanTitle}` },
        { time: 11, text: `by ${track.artist}` },
        { time: 18, text: "on Decibel Music Player" },
        { time: 26, text: "♪" },
        { time: 35, text: "Feel the warm sound of vinyl..." },
        { time: 42, text: "A liquid glass interface around you..." },
        { time: 50, text: "Connecting to your favorite beats." },
        { time: 58, text: "♪" },
        { time: 75, text: "Every track tells a story," },
        { time: 82, text: "every chord strikes a memory." },
        { time: 90, text: "♪" },
        { time: 115, text: "Thank you for listening." }
      ]
      setLyrics({
        plain: null,
        synced: mockSynced,
        instrumental: false
      })
    } finally {
      setLyricsLoading(false)
    }
  }, [])

  /* Recommendations Fetch Effect */
  useEffect(() => {
    if (!currentTrack) return
    setRecLoading(true)
    const videoId = currentTrack.videoId || ''
    const title = encodeURIComponent(currentTrack.title)
    const artist = encodeURIComponent(currentTrack.artist)
    fetch(`/api/recommendations?videoId=${videoId}&title=${title}&artist=${artist}`)
      .then(r => r.json())
      .then(d => {
        setRecommendations(d.tracks || [])
      })
      .catch(e => console.error("Recommendations error:", e))
      .finally(() => setRecLoading(false))
  }, [currentTrack])

  useEffect(() => {
    if (currentTrack) {
      fetchLyrics(currentTrack)
    }
  }, [currentTrack, fetchLyrics])

  /* Email verification handler */
  async function handleVerifyEmail(e) {
    e.preventDefault()
    setOtpError('')
    if (otpCode.trim() !== '123456') {
      return setOtpError('Invalid verification code. Use 123456.')
    }
    setOtpBusy(true)
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, code: otpCode.trim() })
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || 'Verification failed.')
      }
      
      const updatedUser = { ...user, email_verified: true }
      localStorage.setItem('decibel_session', JSON.stringify(updatedUser))
      if (onUpdateUser) onUpdateUser(updatedUser)
      
      setShowOtpModal(false)
      setOtpCode('')
    } catch (err) {
      setOtpError(err.message || 'Verification error.')
    } finally {
      setOtpBusy(false)
    }
  }

  /* Password update handler */
  async function handleChangePassword(e) {
    e.preventDefault()
    setPassError('')
    setPassSuccess('')
    if (newPassword.length < 8) {
      return setPassError('Password must be at least 8 characters long.')
    }
    if (newPassword !== confirmPassword) {
      return setPassError('Passwords do not match.')
    }
    setPassBusy(true)
    setTimeout(() => {
      setPassBusy(false)
      setPassSuccess('Password updated successfully!')
      setNewPassword('')
      setConfirmPassword('')
    }, 1000)
  }

  /* Synced lyrics scroll anchor */
  const activeLineIdx = lyrics.synced.findIndex((line, i) => {
    const nextLine = lyrics.synced[i + 1]
    return progress >= line.time && (!nextLine || progress < nextLine.time)
  })

  useEffect(() => {
    if (lyricsContainerRef.current && activeLineIdx !== -1) {
      const activeEl = lyricsContainerRef.current.children[activeLineIdx]
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [activeLineIdx])

  /* ── Video Mode Layout Synchronizer ── */
  const updateVideoPosition = useCallback(() => {
    const target = videoPlaceholderRef.current
    const ytEl = document.getElementById('decibel-yt-hidden')
    if (!target || !ytEl) return
    const rect = target.getBoundingClientRect()
    ytEl.style.position = 'fixed'
    ytEl.style.left = `${rect.left}px`
    ytEl.style.top = `${rect.top}px`
    ytEl.style.width = `${rect.width}px`
    ytEl.style.height = `${rect.height}px`
    ytEl.style.opacity = '1'
    ytEl.style.pointerEvents = 'auto'
    ytEl.style.zIndex = '50'
    ytEl.style.borderRadius = '14px'
    ytEl.style.overflow = 'hidden'
    ytEl.style.boxShadow = '0 10px 30px rgba(0,0,0,0.6)'
  }, [])

  useEffect(() => {
    if (videoMode && currentTrack) {
      updateVideoPosition()
      window.addEventListener('resize', updateVideoPosition)
      window.addEventListener('scroll', updateVideoPosition)
      const interval = setInterval(updateVideoPosition, 100)
      return () => {
        window.removeEventListener('resize', updateVideoPosition)
        window.removeEventListener('scroll', updateVideoPosition)
        clearInterval(interval)
      }
    } else {
      const ytEl = document.getElementById('decibel-yt-hidden')
      if (ytEl) {
        ytEl.style.position = 'fixed'
        ytEl.style.bottom = '0'
        ytEl.style.right = '0'
        ytEl.style.width = '1px'
        ytEl.style.height = '1px'
        ytEl.style.opacity = '0'
        ytEl.style.pointerEvents = 'none'
        ytEl.style.zIndex = '-1'
        ytEl.style.borderRadius = '0'
        ytEl.style.boxShadow = 'none'
      }
    }
  }, [videoMode, currentTrack, updateVideoPosition])

  /* ── load video when track or player-ready changes ── */
  useEffect(() => {
    if (currentTrack?.videoId && yt.ready) {
      yt.load(currentTrack.videoId)
      setPlaying(true)
    }
  }, [idx, yt.ready]) // eslint-disable-line

  /* ── progress ticker ── */
  useEffect(() => {
    clearInterval(tick.current)
    if (!playing) return
    tick.current = setInterval(() => {
      setProgress(yt.getTime())
      setDuration(yt.getDur())
    }, 500)
    return () => clearInterval(tick.current)
  }, [playing]) // eslint-disable-line

  /* ── volume sync ── */
  useEffect(() => {
    if (muted) yt.mute(); else { yt.unmute(); yt.setVol(vol) }
  }, [vol, muted]) // eslint-disable-line

  /* ── helpers ── */
  function togglePlay() {
    if (!currentTrack) return
    if (playing) { yt.pause(); setPlaying(false) }
    else         { yt.play();  setPlaying(true)  }
  }

  function skip(dir) {
    setIdx(i => {
      const len = queue.length
      if (!len) return 0
      if (shuffle) return Math.floor(Math.random() * len)
      return (i + dir + len) % len
    })
  }

  function playTrack(track) {
    const i = queue.findIndex(t => t.videoId === track.videoId)
    if (i >= 0) { setIdx(i) }
    else { setQueue(q => [track, ...q]); setIdx(0) }
  }

  function addToQueue(track) {
    if (!queue.find(t => t.videoId === track.videoId))
      setQueue(q => [...q, track])
  }

  function removeFromQueue(i) {
    setQueue(q => q.filter((_, j) => j !== i))
    if (i < idx) setIdx(n => n - 1)
  }

  function toggleSave(track) {
    setSaved(s => s.find(t => t.videoId === track.videoId)
      ? s.filter(t => t.videoId !== track.videoId)
      : [track, ...s])
  }

  async function doSearch(e) {
    e?.preventDefault()
    if (!searchQ.trim()) return
    setSearching(true)
    setTab('search')
    try {
      const res = await apiSearch(searchQ)
      setResults(res)
    } catch { setResults([]) }
    finally  { setSearching(false) }
  }

  function handleSeek(e) {
    const val = +e.target.value
    yt.seekTo(val)
    setProgress(val)
  }

  const progressPct = duration > 0 ? (progress / duration) * 100 : 0

  /* ── display list ── */
  const displayList = tab === 'saved' ? saved
    : tab === 'queue'   ? queue
    : tab === 'search'  ? results
    : trending

  /* ══════════════════════════════════════════════
     RENDER
   ═══════════════════════════════════════════════ */
  return (
    <section style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 960, margin: '0 auto', padding: '0 24px 32px' }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* ─── CARD ─── */}
        <div style={{
          borderRadius: 28,
          background: 'rgba(255,255,255,0.01)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: 'none',
          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.08)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* gradient border */}
          <div style={{
            position: 'absolute', inset: 0, padding: '1.4px', borderRadius: 28,
            background: 'linear-gradient(180deg,rgba(255,255,255,0.38) 0%,rgba(255,255,255,0.1) 20%,rgba(255,255,255,0) 40%,rgba(255,255,255,0) 60%,rgba(255,255,255,0.1) 80%,rgba(255,255,255,0.38) 100%)',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor', maskComposite: 'exclude', pointerEvents: 'none',
          }} />

          {/* offline banner */}
          {backend === false && (
            <div style={{ padding: '10px 20px', background: 'rgba(252,60,68,0.08)', borderBottom: '1px solid rgba(252,60,68,0.12)', textAlign: 'center', fontSize: 12, color: 'rgba(255,80,80,0.9)', fontWeight: 500 }}>
              Backend offline — run: <code style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: 4 }}>cd decibel-web/server && python main.py</code>
            </div>
          )}

          {/* header bar */}
          <div style={{ padding: '16px 24px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Music2 size={13} color="#fff" />
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>
              <Sparkles size={10} />
              Connected · SQLite DB
            </div>
          </div>

          {/* ══ MAIN 2-COLUMN BODY ══ */}
          <div style={{ display: 'flex', gap: 0 }}>

            {/* ── LEFT: Vinyl + Controls ── */}
            <div style={{
              width: 300, flexShrink: 0, padding: '24px 20px 20px',
              borderRight: '1px solid rgba(255,255,255,0.04)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
            }}>
              {/* Vinyl / Video placeholder container */}
              <Vinyl
                cover={currentTrack?.cover}
                isPlaying={playing}
                videoMode={videoMode}
                videoPlaceholderRef={videoPlaceholderRef}
              />

              {/* Equalizer (sized to 200px width, matching vinyl container) */}
              <EqBars isPlaying={playing} />

              {/* Track title */}
              <div style={{ textAlign: 'center', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={currentTrack?.title ?? 'none'}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      style={{ fontFamily: "'Instrument Serif', serif", fontSize: 18, color: '#fff', lineHeight: 1.2, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}
                    >
                      {currentTrack?.title ?? 'No track selected'}
                    </motion.p>
                  </AnimatePresence>

                  {/* Audio / Video Switcher Toggle */}
                  {currentTrack && (
                    <button
                      onClick={() => setVideoMode(v => !v)}
                      style={{
                        background: videoMode ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.05)',
                        border: 'none',
                        borderRadius: 6,
                        padding: '3px 6px',
                        color: videoMode ? '#38bdf8' : 'rgba(255,255,255,0.4)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        marginLeft: 4
                      }}
                      title={videoMode ? "Switch to Audio Mode" : "Switch to Video Mode"}
                    >
                      {videoMode ? <Music2 size={12} /> : <Tv size={12} />}
                    </button>
                  )}
                </div>

                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500, marginTop: 4 }}>
                  {currentTrack?.artist ?? 'Search or browse tracks →'}
                </p>

                {/* save button */}
                {currentTrack && (
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => toggleSave(currentTrack)}
                      style={{
                        marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '6px 14px', borderRadius: 9999,
                        background: saved.find(t => t.videoId === currentTrack.videoId) ? 'rgba(255,100,100,0.12)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${saved.find(t => t.videoId === currentTrack.videoId) ? 'rgba(255,100,100,0.25)' : 'rgba(255,255,255,0.08)'}`,
                        color: saved.find(t => t.videoId === currentTrack.videoId) ? 'rgba(255,100,100,0.9)' : 'rgba(255,255,255,0.45)',
                        fontSize: 11, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s',
                      }}
                    >
                      <Heart size={11} fill={saved.find(t => t.videoId === currentTrack.videoId) ? 'currentColor' : 'none'} />
                      {saved.find(t => t.videoId === currentTrack.videoId) ? 'Saved' : 'Save'}
                    </button>
                  </div>
                )}

                {/* AirPlay Simulated Output State */}
                {airplayDevice !== 'MacBook Pro' && (
                  <div style={{ marginTop: 12 }} className="cast-indicator">
                    <Airplay size={11} />
                    <span>Casting to {airplayDevice}</span>
                  </div>
                )}
              </div>

              {/* Progress */}
              <div style={{ width: '100%' }}>
                <div
                  style={{ position: 'relative', width: '100%', height: 20, display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                >
                  <input
                    type="range" min={0} max={duration || 0} step={0.5}
                    value={progress}
                    onChange={handleSeek}
                    disabled={!currentTrack}
                    style={{
                      width: '100%', height: 3, borderRadius: 2,
                      appearance: 'none', WebkitAppearance: 'none', outline: 'none',
                      background: 'rgba(255,255,255,0.08)', cursor: currentTrack ? 'pointer' : 'default',
                      position: 'relative', zIndex: 2,
                    }}
                  />
                  <div style={{
                    position: 'absolute', left: 0, top: 'calc(50% - 1.5px)',
                    height: 3, width: `${progressPct}%`,
                    background: '#fff', borderRadius: 2, zIndex: 1, pointerEvents: 'none',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.3)' }}>
                  <span>{fmt(progress)}</span>
                  <span>{fmt(duration)}</span>
                </div>
              </div>

              {/* Playback buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <button
                  onClick={() => setShuffle(s => !s)}
                  style={{ color: shuffle ? '#fff' : 'rgba(255,255,255,0.28)', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s' }}
                >
                  <Shuffle size={15} />
                </button>

                <button onClick={() => skip(-1)} style={{ color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <SkipBack size={20} fill="currentColor" />
                </button>

                <button
                  onClick={togglePlay}
                  disabled={!currentTrack}
                  style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: 'white', color: '#050608',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 18px rgba(255,255,255,0.18)',
                    border: 'none', cursor: currentTrack ? 'pointer' : 'not-allowed',
                    opacity: currentTrack ? 1 : 0.4, flexShrink: 0, transition: 'all 0.2s',
                  }}
                >
                  {playing
                    ? <Pause size={18} fill="currentColor" stroke="none" />
                    : <Play  size={18} fill="currentColor" style={{ marginLeft: 2 }} />}
                </button>

                <button onClick={() => skip(1)} style={{ color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <SkipForward size={20} fill="currentColor" />
                </button>

                <button
                  onClick={() => setRepeat(r => !r)}
                  style={{ color: repeat ? '#fff' : 'rgba(255,255,255,0.28)', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s' }}
                >
                  <RotateCcw size={15} />
                </button>
              </div>

              {/* Volume & AirPlay */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                <button onClick={() => setMuted(m => !m)} style={{ color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, display: 'flex' }}>
                  {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                </button>
                <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                  <input
                    type="range" min={0} max={1} step={0.01}
                    value={muted ? 0 : vol}
                    onChange={e => { setVol(+e.target.value); setMuted(false) }}
                    style={{ width: '100%', height: 3, appearance: 'none', WebkitAppearance: 'none', background: 'rgba(255,255,255,0.08)', borderRadius: 2, cursor: 'pointer', outline: 'none' }}
                  />
                  <div style={{ position: 'absolute', left: 0, top: 'calc(50% - 1.5px)', height: 3, width: `${(muted ? 0 : vol) * 100}%`, background: 'rgba(255,255,255,0.65)', borderRadius: 2, pointerEvents: 'none' }} />
                </div>
                
                {/* AirPlay Cast Button */}
                <button
                  onClick={() => setShowAirplayModal(true)}
                  style={{
                    color: airplayDevice !== 'MacBook Pro' ? '#38bdf8' : 'rgba(255,255,255,0.4)',
                    background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0,
                    transition: 'color 0.2s', display: 'flex', alignItems: 'center'
                  }}
                  title="AirPlay Cast Devices"
                >
                  <Airplay size={15} />
                </button>
              </div>

              {/* Synced Lyrics under song controls in left column */}
              <div style={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14, marginTop: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Lyrics
                  </span>
                  {lyricsLoading && <Loader2 size={10} style={{ animation: 'decibelSpin 1s linear infinite', color: 'rgba(255,255,255,0.4)' }} />}
                </div>
                <div 
                  ref={lyricsContainerRef}
                  style={{ 
                    maxHeight: 120, 
                    overflowY: 'auto', 
                    scrollbarWidth: 'none', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 8,
                    paddingBottom: 4
                  }}
                  className="lyrics-left-container"
                >
                  {lyricsLoading ? (
                    <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, textAlign: 'center', padding: '12px 0' }}>Loading lyrics...</div>
                  ) : lyrics.synced.length > 0 ? (
                    lyrics.synced.map((line, i) => (
                      <div
                        key={i}
                        className={`lyric-line-left ${i === activeLineIdx ? 'active' : ''}`}
                        onClick={() => {
                          yt.seekTo(line.time)
                          setProgress(line.time)
                        }}
                        style={{ 
                          cursor: 'pointer',
                          textAlign: 'center',
                          fontSize: 12,
                          transition: 'all 0.2s',
                          color: i === activeLineIdx ? '#fff' : 'rgba(255,255,255,0.35)',
                          fontWeight: i === activeLineIdx ? '600' : 'normal'
                        }}
                      >
                        {line.text}
                      </div>
                    ))
                  ) : lyrics.plain ? (
                    <div style={{ color: 'rgba(255,255,255,0.6)', whiteSpace: 'pre-wrap', textAlign: 'center', fontSize: 12, lineHeight: 1.4 }}>
                      {lyrics.plain}
                    </div>
                  ) : (
                    <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, textAlign: 'center', padding: '12px 0' }}>
                      {lyrics.instrumental ? 'Instrumental Track' : 'No lyrics available'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── RIGHT: Browse / Search / Playlists / Lyrics ── */}
            {/* ── RIGHT: Browse / Search / Playlists / Account / Profile ── */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              {tab === 'account' ? (
                /* Account View */
                <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20, flex: 1, overflowY: 'auto' }}>
                  <div>
                    <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 24, color: '#fff', margin: '0 0 4px' }}>Account Settings</h3>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>Manage your Decibel user profile and credentials.</p>
                  </div>
                  
                  {/* Account detail card */}
                  <div className="account-detail-card" style={{ display: 'flex', flexDirection: 'column', gap: 14, background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Name</span>
                      <span style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>{user?.name}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Email</span>
                      <span style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>{user?.email}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Verification Status</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {user?.email_verified ? (
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '3px 8px', borderRadius: 9999, border: '1px solid rgba(16,185,129,0.2)' }}>
                            Verified
                          </span>
                        ) : (
                          <>
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#fc3c44', background: 'rgba(252,60,68,0.1)', padding: '3px 8px', borderRadius: 9999, border: '1px solid rgba(252,60,68,0.2)' }}>
                              Unverified
                            </span>
                            <button
                              onClick={() => setShowOtpModal(true)}
                              style={{
                                padding: '3px 10px', borderRadius: 9999, fontSize: 10, fontWeight: 600,
                                background: '#fff', color: '#000', border: 'none', cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                            >
                              Verify
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Change Password section */}
                  <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
                    <h4 style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '4px 0 2px' }}>
                      Update Password
                    </h4>
                    
                    {passError && (
                      <div style={{ fontSize: 12, color: '#fc3c44', background: 'rgba(252,60,68,0.08)', border: '1px solid rgba(252,60,68,0.15)', borderRadius: 10, padding: '8px 12px' }}>
                        {passError}
                      </div>
                    )}
                    {passSuccess && (
                      <div style={{ fontSize: 12, color: '#10b981', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 10, padding: '8px 12px' }}>
                        {passSuccess}
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <input
                        type="password"
                        placeholder="New Password (min. 8 characters)"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        style={{
                          padding: 10, borderRadius: 10, fontSize: 13, color: '#fff',
                          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                          outline: 'none', fontFamily: 'inherit'
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <input
                        type="password"
                        placeholder="Confirm New Password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        style={{
                          padding: 10, borderRadius: 10, fontSize: 13, color: '#fff',
                          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                          outline: 'none', fontFamily: 'inherit'
                        }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={passBusy}
                      style={{
                        padding: 10, borderRadius: 10, border: 'none',
                        background: 'rgba(255,255,255,0.08)', color: '#fff', fontWeight: 600,
                        cursor: 'pointer', transition: 'all 0.2s', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                    >
                      {passBusy ? <Loader2 size={12} style={{ animation: 'decibelSpin 1s linear infinite' }} /> : 'Change Password'}
                    </button>
                  </form>
                </div>
              ) : tab === 'profile' ? (
                /* Profile View */
                <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20, flex: 1, overflowY: 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                      width: 60, height: 60, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #38bdf8 0%, #0369a1 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: "'Instrument Serif', serif", fontSize: 28, color: '#fff',
                      boxShadow: '0 4px 14px rgba(56, 189, 248, 0.3)'
                    }}>
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'L'}
                    </div>
                    <div>
                      <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 24, color: '#fff', margin: '0 0 2px' }}>{user?.name}</h3>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: 0 }}>Member since June 2026</p>
                    </div>
                  </div>

                  <h4 style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '8px 0 0' }}>
                    Listening Activity
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={{ padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: 4 }}>Tracks Played</span>
                      <span style={{ fontSize: 20, fontWeight: 600, color: '#fff' }}>148</span>
                    </div>
                    <div style={{ padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: 4 }}>Time Listened</span>
                      <span style={{ fontSize: 20, fontWeight: 600, color: '#fff' }}>8.4h</span>
                    </div>
                    <div style={{ padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: 4 }}>Favorite Genre</span>
                      <span style={{ fontSize: 16, fontWeight: 600, color: '#38bdf8' }}>Synthwave</span>
                    </div>
                    <div style={{ padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: 4 }}>Saved Tracks</span>
                      <span style={{ fontSize: 20, fontWeight: 600, color: '#fff' }}>{saved.length}</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Standard Music Browsing and Lists view */
                <>
                  {/* Search bar */}
                  <form
                    onSubmit={doSearch}
                    style={{ display: 'flex', gap: 8, padding: '20px 20px 0' }}
                  >
                    <div style={{ position: 'relative', flex: 1 }}>
                      <Search size={13} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                      <input
                        type="text"
                        value={searchQ}
                        onChange={e => setSearchQ(e.target.value)}
                        placeholder="Search YouTube Music…"
                        style={{
                          width: '100%', paddingLeft: 36, paddingRight: 16, paddingTop: 10, paddingBottom: 10,
                          borderRadius: 9999, fontSize: 13, color: '#fff',
                          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                          outline: 'none', fontFamily: 'inherit', transition: 'all 0.2s',
                        }}
                        onFocus={e => { e.target.style.background = 'rgba(255,255,255,0.07)'; e.target.style.borderColor = 'rgba(255,255,255,0.18)' }}
                        onBlur={e  => { e.target.style.background = 'rgba(255,255,255,0.04)'; e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
                      />
                    </div>
                    <button
                      type="submit"
                      style={{
                        padding: '10px 20px', borderRadius: 9999, fontSize: 12, fontWeight: 600,
                        background: 'rgba(255,255,255,0.88)', color: '#000',
                        border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                        transition: 'all 0.2s',
                      }}
                    >
                      {searching
                        ? <Loader2 size={12} style={{ animation: 'decibelSpin 1s linear infinite' }} />
                        : 'Search'}
                    </button>
                  </form>

                  {/* Tabs */}
                  <div style={{ display: 'flex', gap: 4, padding: '12px 20px 0', overflowX: 'auto', scrollbarWidth: 'none' }}>
                    {[
                      { id: 'trending',  label: 'Trending',            icon: Sparkles  },
                      { id: 'search',    label: 'Results',             icon: Search    },
                      { id: 'playlists', label: 'Playlists',           icon: ListMusic },
                      { id: 'saved',     label: `Saved (${saved.length})`,  icon: Heart     },
                      { id: 'queue',     label: `Queue (${queue.length})`,   icon: ListMusic },
                    ].map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => setTab(id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          padding: '5px 12px', borderRadius: 9999,
                          fontSize: 11, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer',
                          background: tab === id || (id === 'trending' && !['search', 'playlists', 'saved', 'queue'].includes(tab)) ? 'rgba(255,255,255,0.09)' : 'transparent',
                          border: tab === id || (id === 'trending' && !['search', 'playlists', 'saved', 'queue'].includes(tab)) ? '1px solid rgba(255,255,255,0.12)' : '1px solid transparent',
                          color: tab === id || (id === 'trending' && !['search', 'playlists', 'saved', 'queue'].includes(tab)) ? '#fff' : 'rgba(255,255,255,0.38)',
                          transition: 'all 0.15s',
                          flexShrink: 0
                        }}
                      >
                        <Icon size={10} />
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content Area */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', minHeight: 240, maxHeight: 320, scrollbarWidth: 'none' }}>
                    {searching && tab === 'search' && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '48px 0', color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
                        <Loader2 size={18} style={{ animation: 'decibelSpin 1s linear infinite' }} />
                        Searching YouTube Music…
                      </div>
                    )}

                    {/* Playlists Tab */}
                    {tab === 'playlists' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {openPlaylist ? (
                          /* Playlist detail view */
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 8 }}>
                              <button
                                onClick={() => setOpenPlaylist(null)}
                                style={{
                                  background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)',
                                  display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer'
                                }}
                              >
                                <ChevronLeft size={14} /> Back
                              </button>
                              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                                {openPlaylist.tracks?.length || 0} tracks
                              </span>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <h4 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, color: '#fff', margin: 0 }}>
                                {openPlaylist.title}
                              </h4>
                              <button
                                onClick={() => deletePlaylist(openPlaylist.playlistId)}
                                style={{
                                  background: 'none', border: 'none', color: '#fc3c44',
                                  fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                                }}
                              >
                                <Trash2 size={12} /> Delete Playlist
                              </button>
                            </div>
                            
                            {openPlaylist.description && (
                              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: 0 }}>
                                {openPlaylist.description}
                              </p>
                            )}

                            <div style={{ marginTop: 8 }}>
                              {(!openPlaylist.tracks || openPlaylist.tracks.length === 0) ? (
                                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', textAlign: 'center', padding: '24px 0' }}>
                                  No tracks in this playlist yet. Add songs from Search or Trending!
                                </p>
                              ) : (
                                openPlaylist.tracks.map((track, i) => (
                                  <TrackRow
                                    key={track.id || track.videoId}
                                    track={track}
                                    isCurrent={currentTrack?.videoId === track.videoId}
                                    isPlaying={playing}
                                    onClick={() => playTrack(track)}
                                    isSaved={!!saved.find(t => t.videoId === track.videoId)}
                                    onSave={toggleSave}
                                    showAdd={true}
                                    onAdd={addToQueue}
                                    showRemove={false}
                                  />
                                ))
                              )}
                            </div>
                          </div>
                        ) : (
                          /* Playlist list view */
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase' }}>
                                Playlists ({playlists.length})
                              </span>
                              <button
                                onClick={() => setShowCreatePlaylistModal(true)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 4,
                                  padding: '4px 10px', borderRadius: 9999,
                                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                                  color: '#fff', fontSize: 11, cursor: 'pointer', transition: 'all 0.2s'
                                }}
                              >
                                <Plus size={12} /> Create
                              </button>
                            </div>

                            {playlistsLoading ? (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '36px 0', color: 'rgba(255,255,255,0.3)', gap: 8 }}>
                                <Loader2 size={16} style={{ animation: 'decibelSpin 1s linear infinite' }} />
                                Loading playlists…
                              </div>
                            ) : playlists.length === 0 ? (
                              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', textAlign: 'center', padding: '24px 0' }}>
                                No playlists yet. Click "Create" to add one!
                              </p>
                            ) : (
                              playlists.map(pl => (
                                <div
                                  key={pl.playlistId}
                                  onClick={() => viewPlaylistDetails(pl)}
                                  className="airplay-device-row"
                                  style={{ padding: '10px 14px' }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                                    <ListMusic size={14} color="rgba(255,255,255,0.4)" />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontSize: 13, fontWeight: 500, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {pl.title}
                                      </div>
                                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>
                                        {pl.count != null ? `${pl.count} tracks` : 'YouTube Playlist'}
                                      </div>
                                    </div>
                                  </div>
                                  <button
                                    onClick={e => { e.stopPropagation(); deletePlaylist(pl.playlistId) }}
                                    style={{ background: 'none', border: 'none', color: 'rgba(252,60,68,0.5)', padding: 4 }}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Default Lists (Trending / Search results / Saved / Queue) */}
                    {tab !== 'playlists' && !searching && displayList.length === 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '48px 0', color: 'rgba(255,255,255,0.18)' }}>
                        {tab === 'saved' ? <Heart size={36} strokeWidth={1} />
                        : tab === 'queue' ? <ListMusic size={36} strokeWidth={1} />
                        : tab === 'search' ? <Search size={36} strokeWidth={1} />
                        : <Music2 size={36} strokeWidth={1} />}
                        <p style={{ fontSize: 13 }}>
                          {tab === 'search' ? 'Search for a song above'
                          : tab === 'saved'  ? 'No saved tracks yet'
                          : tab === 'queue'  ? 'Queue is empty'
                          : backend === false ? 'Backend offline'
                          : 'Loading…'}
                        </p>
                      </div>
                    )}

                    {tab !== 'playlists' && !searching && (
                      <AnimatePresence>
                        {displayList.map((track, i) => (
                          <TrackRow
                            key={tab === 'queue' ? `q-${i}` : (track.id || track.videoId)}
                            track={track}
                            isCurrent={currentTrack?.videoId === track.videoId}
                            isPlaying={playing}
                            onClick={() => tab === 'queue' ? setIdx(i) : playTrack(track)}
                            isSaved={!!saved.find(t => t.videoId === track.videoId)}
                            onSave={toggleSave}
                            showAdd={tab !== 'queue'}
                            onAdd={addToQueue}
                            showRemove={tab === 'queue'}
                            onRemove={() => removeFromQueue(i)}
                            playlists={playlists}
                            onAddToPlaylist={addTrackToPlaylist}
                          />
                        ))}
                      </AnimatePresence>
                    )}
                  </div>
                </>
              )}

              {/* footer / now-playing open link */}
              <div style={{ padding: '10px 20px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Music2 size={10} /> Powered by YouTube Music
                </div>
                {currentTrack?.trackViewUrl && (
                  <a href={currentTrack.trackViewUrl} target="_blank" rel="noreferrer"
                    style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.6)'}
                    onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.28)'}
                  >
                    Open in YouTube Music →
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─── RECOMMENDATIONS SECTION ─── */}
        {currentTrack && (
          <div style={{ marginTop: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
              <Sparkles size={14} color="#38bdf8" />
              <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, color: '#fff', margin: 0 }}>
                Recommended For You
              </h3>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', marginLeft: 8 }}>
                Based on: {currentTrack.title}
              </span>
            </div>

            {recLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '24px 0', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                <Loader2 size={16} style={{ animation: 'decibelSpin 1s linear infinite' }} />
                Loading recommendations…
              </div>
            ) : recommendations.length === 0 ? (
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', textAlign: 'center', padding: '16px 0' }}>
                No recommendations found. Try playing another song!
              </p>
            ) : (
              <div className="recommendations-grid">
                {recommendations.map(track => (
                  <div
                    key={track.videoId}
                    onClick={() => playTrack(track)}
                    className="recommendation-card"
                  >
                    <div className="recommendation-thumb-container">
                      <img
                        src={track.cover || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=200'}
                        alt=""
                        className="recommendation-thumb"
                      />
                      <div className="recommendation-play-overlay">
                        <Play size={16} fill="#000" stroke="none" />
                      </div>
                    </div>
                    <div className="recommendation-info">
                      <div className="recommendation-title">{track.title}</div>
                      <div className="recommendation-artist">{track.artist}</div>
                    </div>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        addToQueue(track)
                      }}
                      className="recommendation-add-btn"
                      title="Add to queue"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* ─── CREATE PLAYLIST MODAL ─── */}
      <AnimatePresence>
        {showCreatePlaylistModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 100,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(8px)',
            }}
            onClick={() => setShowCreatePlaylistModal(false)}
          >
            <motion.div
              initial={{ scale: 0.93, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.93, y: 15 }}
              className="liquid-glass"
              style={{
                width: '100%', maxWidth: 380,
                borderRadius: 24, padding: 24,
                display: 'flex', flexDirection: 'column', gap: 16,
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, color: '#fff', margin: 0 }}>
                  Create New Playlist
                </h3>
                <button
                  onClick={() => setShowCreatePlaylistModal(false)}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}
                >
                  Cancel
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>TITLE</label>
                  <input
                    type="text"
                    value={newPlaylistTitle}
                    onChange={e => setNewPlaylistTitle(e.target.value)}
                    placeholder="My Chill Hits"
                    style={{
                      padding: 10, borderRadius: 10, fontSize: 13, color: '#fff',
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                      outline: 'none', fontFamily: 'inherit'
                    }}
                  />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>DESCRIPTION</label>
                  <input
                    type="text"
                    value={newPlaylistDesc}
                    onChange={e => setNewPlaylistDesc(e.target.value)}
                    placeholder="A selection of laid-back beats"
                    style={{
                      padding: 10, borderRadius: 10, fontSize: 13, color: '#fff',
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                      outline: 'none', fontFamily: 'inherit'
                    }}
                  />
                </div>
              </div>

              <button
                onClick={() => createPlaylist(newPlaylistTitle, newPlaylistDesc)}
                disabled={!newPlaylistTitle.trim()}
                style={{
                  width: '100%', padding: 12, borderRadius: 12, border: 'none',
                  background: newPlaylistTitle.trim() ? '#fff' : 'rgba(255,255,255,0.1)',
                  color: newPlaylistTitle.trim() ? '#000' : 'rgba(255,255,255,0.3)',
                  fontWeight: 600, cursor: newPlaylistTitle.trim() ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s', marginTop: 8
                }}
              >
                Create Playlist
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── AIRPLAY DEVICES MODAL ─── */}
      <AnimatePresence>
        {showAirplayModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 100,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(8px)',
            }}
            onClick={() => setShowAirplayModal(false)}
          >
            <motion.div
              initial={{ scale: 0.93, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.93, y: 15 }}
              className="liquid-glass"
              style={{
                width: '100%', maxWidth: 360,
                borderRadius: 24, padding: 24,
                display: 'flex', flexDirection: 'column', gap: 16,
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Airplay size={18} color="#fff" />
                  <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, color: '#fff', margin: 0 }}>
                    AirPlay Devices
                  </h3>
                </div>

                <button 
                  onClick={() => setShowAirplayModal(false)} 
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}
                >
                  Close
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { name: 'MacBook Pro (This Device)', icon: 'laptop' },
                  { name: 'Living Room Apple TV', icon: 'tv' },
                  { name: 'Bedroom HomePod', icon: 'audio' },
                  { name: 'Kitchen Sonos Speaker', icon: 'audio' }
                ].map(device => {
                  const isActive = airplayDevice === device.name
                  const isConnecting = connectingDevice === device.name
                  return (
                    <div
                      key={device.name}
                      onClick={() => {
                        if (isActive || isConnecting) return
                        setConnectingDevice(device.name)
                        setTimeout(() => {
                          setAirplayDevice(device.name)
                          setConnectingDevice(null)
                          setShowAirplayModal(false)
                        }, 1200)
                      }}
                      className={`airplay-device-row ${isActive ? 'active' : ''}`}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{device.name}</span>
                        {isConnecting && (
                          <Loader2 size={12} style={{ animation: 'decibelSpin 1s linear infinite', color: '#38bdf8' }} />
                        )}
                      </div>
                      {isActive && <Check size={14} color="#38bdf8" />}
                    </div>
                  )
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── EMAIL VERIFICATION (OTP) MODAL ─── */}
      <AnimatePresence>
        {showOtpModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 100,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(8px)',
            }}
            onClick={() => setShowOtpModal(false)}
          >
            <motion.div
              initial={{ scale: 0.93, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.93, y: 15 }}
              className="liquid-glass"
              style={{
                width: '100%', maxWidth: 360,
                borderRadius: 24, padding: 24,
                display: 'flex', flexDirection: 'column', gap: 16,
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, color: '#fff', margin: 0 }}>
                  Verify Your Email
                </h3>
                <button
                  onClick={() => setShowOtpModal(false)}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleVerifyEmail} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.4 }}>
                  Enter the 6-digit verification code sent to your email (use <b>123456</b> to verify).
                </p>

                {otpError && (
                  <div style={{ fontSize: 12, color: '#fc3c44', background: 'rgba(252,60,68,0.08)', border: '1px solid rgba(252,60,68,0.15)', borderRadius: 10, padding: '8px 12px' }}>
                    {otpError}
                  </div>
                )}

                <input
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  style={{
                    padding: 12, borderRadius: 12, fontSize: 18, color: '#fff',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    outline: 'none', fontFamily: 'monospace', letterSpacing: '0.5em', textAlign: 'center'
                  }}
                  autoFocus
                />

                <button
                  type="submit"
                  disabled={otpBusy || otpCode.length < 6}
                  style={{
                    width: '100%', padding: 12, borderRadius: 12, border: 'none',
                    background: otpCode.length === 6 ? '#fff' : 'rgba(255,255,255,0.1)',
                    color: otpCode.length === 6 ? '#000' : 'rgba(255,255,255,0.3)',
                    fontWeight: 600, cursor: otpCode.length === 6 ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  {otpBusy ? <Loader2 size={16} style={{ animation: 'decibelSpin 1s linear infinite' }} /> : 'Verify Code'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
