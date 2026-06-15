import React from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Shuffle, RotateCcw, ListMusic, Video } from 'lucide-react';

export default function Player({ audio, ytPlayer, isYouTubeTrack, onOpenQueue }) {
  const {
    isPlaying: audioIsPlaying,
    currentTime: audioCurrentTime,
    duration: audioDuration,
    volume,
    isMuted,
    currentTrack,
    togglePlay,
    next,
    prev,
    seek,
    setVolume,
    setIsMuted,
    repeatMode,
    isShuffled,
    toggleShuffle,
    toggleRepeat,
  } = audio;

  // For YouTube tracks, use ytPlayer state; otherwise use HTML audio state
  const isPlaying  = isYouTubeTrack ? ytPlayer?.isPlaying  : audioIsPlaying;
  const currentTime = isYouTubeTrack ? ytPlayer?.currentTime : audioCurrentTime;
  const duration    = isYouTubeTrack ? ytPlayer?.duration   : audioDuration;

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleTogglePlay = () => {
    if (!currentTrack) return;
    if (isYouTubeTrack && ytPlayer) {
      isPlaying ? ytPlayer.pause() : ytPlayer.play();
    } else {
      togglePlay();
    }
  };

  const handleSeek = (e) => {
    const val = parseFloat(e.target.value);
    if (isYouTubeTrack && ytPlayer) ytPlayer.seekTo(val);
    else seek(val);
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (isMuted) setIsMuted(false);
    // Always sync YT player volume too
    if (ytPlayer) ytPlayer.setVolume(val);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <footer className="liquid-glass" style={{
      height: '88px',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      display: 'grid',
      gridTemplateColumns: '1.2fr 2fr 1.2fr',
      alignItems: 'center',
      padding: '0 28px',
      position: 'relative',
      zIndex: 20,
      flexShrink: 0,
    }}>

      {/* Track Info — Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', overflow: 'hidden' }}>
        {currentTrack ? (
          <>
            {/* Album art + sliding vinyl disc */}
            <div style={{
              position: 'relative',
              width: '56px',
              height: '56px',
              flexShrink: 0,
              marginRight: isPlaying ? '24px' : '0px',
              transition: 'margin-right 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
            }}>
              {/* Vinyl disc */}
              <div style={{
                position: 'absolute', top: '2px', left: '2px',
                width: '52px', height: '52px', borderRadius: '50%',
                background: 'radial-gradient(circle, #050608 22%, #111 25%, #222 45%, #000 95%)',
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: '0 3px 8px rgba(0,0,0,0.5)',
                zIndex: 1,
                transform: isPlaying ? 'translateX(45%)' : 'translateX(0%)',
                transition: 'transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
                animation: isPlaying ? 'recordSpin 3.5s linear infinite' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  backgroundColor: 'rgb(var(--theme-glow-rgb))',
                  border: '1px solid rgba(255,255,255,0.2)',
                }} />
              </div>
              {/* Cover art */}
              <img
                src={currentTrack.cover}
                alt={currentTrack.title}
                style={{
                  position: 'absolute', top: 0, left: 0,
                  width: '56px', height: '56px',
                  borderRadius: '8px', objectFit: 'cover',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
                  zIndex: 2,
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontSize: '16px', fontWeight: 400, color: 'white',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {currentTrack.title}
                </span>
                {/* YouTube badge */}
                {isYouTubeTrack && (
                  <span style={{
                    flexShrink: 0,
                    display: 'flex', alignItems: 'center', gap: '3px',
                    padding: '2px 7px', borderRadius: '9999px',
                    background: 'rgba(255,0,0,0.12)',
                    border: '1px solid rgba(255,0,0,0.2)',
                    fontSize: '10px', fontWeight: 600, color: '#ff4444',
                  }}>
                    <Video size={9} /> YT
                  </span>
                )}
              </div>
              <span style={{
                fontSize: '12px', color: 'rgba(255,255,255,0.45)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {currentTrack.artist}
              </span>
            </div>
          </>
        ) : (
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', fontWeight: 500 }}>
            No song selected
          </span>
        )}
      </div>

      {/* Playback Controls — Center */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
        width: '100%', maxWidth: '550px', margin: '0 auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button
            onClick={toggleShuffle}
            style={{ color: isShuffled ? 'rgb(var(--theme-glow-rgb))' : 'rgba(255,255,255,0.3)' }}
            title={`Shuffle: ${isShuffled ? 'On' : 'Off'}`}
          >
            <Shuffle size={16} />
          </button>

          <button onClick={prev} style={{ color: 'rgba(255,255,255,0.6)' }} title="Previous">
            <SkipBack size={20} fill="currentColor" />
          </button>

          <button
            onClick={handleTogglePlay}
            disabled={!currentTrack}
            style={{
              width: '42px', height: '42px', borderRadius: '50%',
              backgroundColor: 'white', color: '#050608',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(255,255,255,0.18)',
              cursor: currentTrack ? 'pointer' : 'not-allowed',
              opacity: currentTrack ? 1 : 0.5,
              flexShrink: 0,
            }}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying
              ? <Pause size={18} fill="currentColor" stroke="none" />
              : <Play  size={18} fill="currentColor" style={{ marginLeft: '2px' }} />}
          </button>

          <button onClick={next} style={{ color: 'rgba(255,255,255,0.6)' }} title="Next">
            <SkipForward size={20} fill="currentColor" />
          </button>

          <button
            onClick={toggleRepeat}
            style={{
              color: repeatMode !== 'off' ? 'rgb(var(--theme-glow-rgb))' : 'rgba(255,255,255,0.3)',
              position: 'relative'
            }}
            title={`Repeat: ${repeatMode === 'one' ? 'One' : repeatMode === 'all' ? 'All' : 'Off'}`}
          >
            <RotateCcw size={16} />
            {repeatMode === 'one' && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                fontSize: '8px',
                fontWeight: 700,
                color: 'rgb(var(--theme-glow-rgb))',
                backgroundColor: 'rgba(255,255,255,0.15)',
                borderRadius: '50%',
                width: '10px',
                height: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>1</span>
            )}
          </button>
        </div>

        {/* Progress bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          width: '100%', fontSize: '11px', fontWeight: 600,
          color: 'rgba(255,255,255,0.35)',
        }}>
          <span style={{ width: '38px', textAlign: 'right' }}>{formatTime(currentTime)}</span>

          <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', height: '16px' }}>
            <input
              type="range" min="0" max={duration || 0} step="0.5"
              value={currentTime || 0}
              onChange={handleSeek}
              disabled={!currentTrack}
              style={{
                width: '100%', height: '4px', borderRadius: '2px',
                appearance: 'none', WebkitAppearance: 'none', outline: 'none',
                background: 'rgba(255,255,255,0.1)',
                cursor: currentTrack ? 'pointer' : 'not-allowed',
                position: 'relative', zIndex: 2,
              }}
            />
            <div style={{
              position: 'absolute', left: 0, top: '6px',
              height: '4px', width: `${progressPercent}%`,
              backgroundColor: 'white', borderRadius: '2px',
              zIndex: 1, pointerEvents: 'none',
            }} />
          </div>

          <span style={{ width: '38px' }}>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Volume & Queue — Right */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '16px' }}>
        <button onClick={onOpenQueue} style={{ color: 'rgba(255,255,255,0.5)' }} title="Queue">
          <ListMusic size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '130px' }}>
          <button
            onClick={() => setIsMuted(!isMuted)}
            style={{ color: 'rgba(255,255,255,0.5)', display: 'flex' }}
          >
            {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>

          <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
            <input
              type="range" min="0" max="1" step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              style={{
                width: '100%', height: '4px', borderRadius: '2px',
                appearance: 'none', WebkitAppearance: 'none', outline: 'none',
                background: 'rgba(255,255,255,0.1)', cursor: 'pointer',
              }}
            />
            <div style={{
              position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
              height: '4px', width: `${isMuted ? 0 : volume * 100}%`,
              backgroundColor: 'rgb(var(--theme-glow-rgb))',
              borderRadius: '2px', pointerEvents: 'none',
            }} />
          </div>
        </div>
      </div>
    </footer>
  );
}
