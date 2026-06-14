import React, { useState } from 'react';
import { Play, Pause, Disc, ArrowRight } from 'lucide-react';

export default function TrackList({ tracks, currentTrack, isPlaying, onTrackSelect }) {
  const [hoveredId, setHoveredId] = useState(null);
  
  // Format seconds to mm:ss
  const formatTime = (secs) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getSourceBadge = (source) => {
    switch (source) {
      case 'spotify':
        return {
          label: 'Spotify',
          bg: 'rgba(29, 185, 84, 0.15)',
          color: '#1db954',
          border: '1px solid rgba(29, 185, 84, 0.2)'
        };
      case 'applemusic':
        return {
          label: 'Apple Music',
          bg: 'rgba(252, 60, 68, 0.15)',
          color: '#fc3c44',
          border: '1px solid rgba(252, 60, 68, 0.2)'
        };
      case 'audius':
        return {
          label: '🎵 Audius — Full Song',
          bg: 'rgba(204, 0, 255, 0.12)',
          color: '#cc00ff',
          border: '1px solid rgba(204, 0, 255, 0.2)'
        };
      case 'archive':
        return {
          label: '📼 Archive.org — Full Song',
          bg: 'rgba(251, 191, 36, 0.12)',
          color: '#fbbf24',
          border: '1px solid rgba(251, 191, 36, 0.2)'
        };
      case 'featured':
        return {
          label: '⭐ Featured',
          bg: 'rgba(139, 92, 246, 0.12)',
          color: '#a78bfa',
          border: '1px solid rgba(139, 92, 246, 0.2)'
        };
      default:
        return {
          label: '🎶 Full Song',
          bg: 'rgba(255, 255, 255, 0.06)',
          color: 'rgba(255,255,255,0.6)',
          border: '1px solid rgba(255,255,255,0.1)'
        };
    }
  };

  if (!tracks || tracks.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        color: 'var(--text-muted)',
        gap: '12px'
      }}>
        <Disc size={40} className="vinyl-record" style={{ animationDuration: '6s' }} />
        <p>No tracks found. Type a query in the Search tab to search globally!</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {/* Table Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '48px 2.5fr 1.8fr 1.5fr 80px',
        padding: '8px 16px',
        fontSize: '12px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '1px',
        color: 'var(--text-muted)',
        borderBottom: '1px solid var(--border-light)',
        marginBottom: '8px'
      }}>
        <div style={{ textAlign: 'center' }}>#</div>
        <div>Title</div>
        <div>Album</div>
        <div>Source</div>
        <div style={{ textAlign: 'right' }}>Time</div>
      </div>

      {/* Track Rows */}
      {tracks.map((track, idx) => {
        const isCurrent = currentTrack?.id === track.id;
        const isCurrentPlaying = isCurrent && isPlaying;
        const badge = getSourceBadge(track.source);
        const isSliderActive = isCurrentPlaying || (hoveredId === track.id);

        return (
          <div
            key={track.id}
            className={`track-row ${isCurrent ? 'active' : ''}`}
            onClick={() => onTrackSelect(track, tracks)}
            onMouseEnter={() => setHoveredId(track.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{ cursor: 'pointer' }}
          >
            {/* Play Index / Icon */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}>
              <span className="track-index" style={{
                display: isCurrent ? 'none' : 'block',
                fontWeight: 600,
                fontSize: '14px'
              }}>
                {idx + 1}
              </span>
              
              {/* Active Playing Equalizer Indicator */}
              {isCurrentPlaying ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '2px',
                  width: '12px',
                  height: '12px'
                }}>
                  <div style={{ width: '2px', background: 'currentColor', animation: 'eqBar 0.8s infinite alternate', animationDelay: '0.1s' }} />
                  <div style={{ width: '2px', background: 'currentColor', animation: 'eqBar 0.8s infinite alternate', animationDelay: '0.3s' }} />
                  <div style={{ width: '2px', background: 'currentColor', animation: 'eqBar 0.8s infinite alternate', animationDelay: '0.5s' }} />
                  
                  <style>{`
                    @keyframes eqBar {
                      0% { height: 2px; }
                      100% { height: 12px; }
                    }
                  `}</style>
                </div>
              ) : isCurrent ? (
                <Play size={14} fill="currentColor" />
              ) : null}

              {/* Hover Play Icon */}
              <div className="hover-play" style={{ display: 'none' }}>
                {isCurrentPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
              </div>
            </div>

            {/* Title & Artist info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
              {/* Image & Slider Disk Container */}
              <div style={{
                position: 'relative',
                width: '40px',
                height: '40px',
                flexShrink: 0,
                marginRight: isSliderActive ? '18px' : '0px',
                transition: 'margin-right 0.35s cubic-bezier(0.25, 0.8, 0.25, 1)'
              }}>
                {/* Sliding Vinyl Record Disc */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, #050608 22%, #111 25%, #222 45%, #000 95%)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                  zIndex: 1,
                  transform: isSliderActive ? 'translateX(45%)' : 'translateX(0%)',
                  transition: 'transform 0.35s cubic-bezier(0.25, 0.8, 0.25, 1)',
                  animation: isCurrentPlaying ? 'recordSpin 3.5s linear infinite' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {/* Spindle Center Hole */}
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: 'rgb(var(--theme-glow-rgb))',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }} />
                </div>

                {/* Album Cover Art */}
                <img
                  src={track.cover}
                  alt={track.title}
                  loading="lazy"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '40px',
                    height: '40px',
                    borderRadius: '6px',
                    objectFit: 'cover',
                    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.35)',
                    zIndex: 2,
                    border: '1px solid rgba(255,255,255,0.08)'
                  }}
                />
              </div>

              {/* Text Description */}
              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <span style={{
                  fontWeight: 600,
                  fontSize: '15px',
                  color: isCurrent ? 'white' : 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {track.title}
                </span>
                <span style={{
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {track.artist}
                </span>
              </div>
            </div>

            {/* Album */}
            <div style={{
              fontSize: '14px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              paddingRight: '12px'
            }}>
              {track.album}
            </div>

            {/* Source Badge */}
            <div>
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.3px',
                padding: '3px 8px',
                borderRadius: '50px',
                background: badge.bg,
                color: badge.color,
                border: badge.border,
                display: 'inline-block'
              }}>
                {badge.label}
              </span>
            </div>

            {/* Duration */}
            <div style={{
              textAlign: 'right',
              fontSize: '14px',
              fontWeight: 500
            }}>
              {formatTime(track.duration)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

