import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Play, Loader2 } from 'lucide-react';

const API = import.meta.env.PROD ? '' : 'http://localhost:8000';

function TrackChip({ track, onPlay, isPlaying }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={() => onPlay(track)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '8px 10px', borderRadius: '12px', cursor: 'pointer',
        background: hovered
          ? 'rgba(255,255,255,0.06)'
          : isPlaying
            ? 'rgba(var(--theme-glow-rgb),0.08)'
            : 'rgba(255,255,255,0.02)',
        border: `1px solid ${isPlaying ? 'rgba(var(--theme-glow-rgb),0.15)' : 'rgba(255,255,255,0.05)'}`,
        transition: 'all 0.2s ease',
        flexShrink: 0,
        minWidth: '180px',
        maxWidth: '220px',
        position: 'relative',
      }}
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <img
          src={track.cover}
          alt=""
          style={{ width: 38, height: 38, borderRadius: '8px', objectFit: 'cover', display: 'block' }}
          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=80'; }}
        />
        {hovered && (
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '8px',
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Play size={14} fill="white" color="white" />
          </div>
        )}
      </div>
      <div style={{ overflow: 'hidden', flex: 1 }}>
        <div style={{
          fontSize: '13px', fontWeight: 500,
          color: isPlaying ? 'rgb(var(--theme-glow-rgb))' : '#fff',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {track.title}
        </div>
        <div style={{
          fontSize: '11px', color: 'rgba(255,255,255,0.4)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {track.artist}
        </div>
      </div>
    </div>
  );
}

export default function Recommendations({ currentTrack, currentTrackId, onPlay }) {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const prevId = useRef(null);

  useEffect(() => {
    if (!currentTrack) return;
    if (currentTrack.id === prevId.current) return;
    prevId.current = currentTrack.id;

    setLoading(true);
    const params = new URLSearchParams();
    if (currentTrack.videoId) params.set('videoId', currentTrack.videoId);
    if (currentTrack.title) params.set('title', currentTrack.title);
    if (currentTrack.artist) params.set('artist', currentTrack.artist);

    fetch(`${API}/api/recommendations?${params}`)
      .then(r => r.ok ? r.json() : { tracks: [] })
      .then(data => setTracks(data.tracks || []))
      .catch(() => setTracks([]))
      .finally(() => setLoading(false));
  }, [currentTrack?.id]);

  if (!currentTrack) return null;
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.3)', fontSize: '13px', padding: '4px 0' }}>
      <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
      Loading recommendations…
      <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
    </div>
  );
  if (!tracks.length) return null;

  return (
    <div style={{ width: '100%' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        marginBottom: '12px',
        fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)',
      }}>
        <Sparkles size={11} />
        Up Next · Based on what you're playing
      </div>
      <div style={{
        display: 'flex', gap: '8px',
        overflowX: 'auto',
        paddingBottom: '6px',
        scrollbarWidth: 'none',
      }}>
        {tracks.map(track => (
          <TrackChip
            key={track.id || track.videoId}
            track={track}
            onPlay={onPlay}
            isPlaying={currentTrackId === track.id}
          />
        ))}
      </div>
    </div>
  );
}
