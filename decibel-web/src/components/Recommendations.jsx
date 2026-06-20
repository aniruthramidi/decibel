import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Play, Loader2 } from 'lucide-react';
import { FEATURED_TRACKS } from '../services/musicApi';

const API = import.meta.env.PROD ? '' : 'http://localhost:8000';

function TrackChip({ track, onPlay, isPlaying }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={() => onPlay(track)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '14px',
        padding: '12px 16px', borderRadius: '16px', cursor: 'pointer',
        background: hovered
          ? 'rgba(255,255,255,0.06)'
          : isPlaying
            ? 'rgba(var(--theme-glow-rgb),0.08)'
            : 'rgba(255,255,255,0.02)',
        border: `1px solid ${isPlaying ? 'rgba(var(--theme-glow-rgb),0.15)' : 'rgba(255,255,255,0.05)'}`,
        transition: 'all 0.2s ease',
        position: 'relative',
        width: '100%',
      }}
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <img
          src={track.cover}
          alt=""
          style={{ width: 48, height: 48, borderRadius: '10px', objectFit: 'cover', display: 'block' }}
          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=100'; }}
        />
        {hovered && (
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '10px',
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Play size={16} fill="white" color="white" />
          </div>
        )}
      </div>
      <div style={{ overflow: 'hidden', flex: 1 }}>
        <div style={{
          fontSize: '14px', fontWeight: 600,
          color: isPlaying ? 'rgb(var(--theme-glow-rgb))' : '#fff',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {track.title}
        </div>
        <div style={{
          fontSize: '12px', color: 'rgba(255,255,255,0.4)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          marginTop: '2px',
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
    if (!currentTrack) {
      setTracks(FEATURED_TRACKS.slice(0, 4));
      return;
    }
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

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.3)', fontSize: '13px', padding: '12px 0' }}>
      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
      Loading recommendations…
      <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
    </div>
  );
  if (!tracks.length) return null;

  return (
    <div style={{ width: '100%' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        marginBottom: '16px',
        fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)',
      }}>
        <Sparkles size={11} />
        {currentTrack ? 'Up Next · Recommended for You' : 'Up Next · Featured Tracks'}
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
        width: '100%',
      }}>
        {tracks.slice(0, 4).map(track => (
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
