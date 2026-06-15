import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic2, Music2 } from 'lucide-react';

const API = 'http://localhost:8000';

function parseSynced(raw) {
  if (!raw) return [];
  return raw.split('\n').map(line => {
    const m = line.match(/^\[(\d+):(\d+\.\d+)\]\s*(.*)/);
    if (!m) return null;
    const secs = parseInt(m[1]) * 60 + parseFloat(m[2]);
    return { time: secs, text: m[3].trim() };
  }).filter(Boolean);
}

export default function Lyrics({ currentTrack, currentTime }) {
  const [lyrics, setLyrics] = useState(null); // { plain, synced, instrumental }
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [fontSize, setFontSize] = useState(14);
  const containerRef = useRef(null);
  const activeRef = useRef(null);
  const prevTrackId = useRef(null);

  const fetchLyrics = useCallback(async (track) => {
    setLoading(true);
    setLyrics(null);
    setActiveIdx(0);
    try {
      const res = await fetch(
        `${API}/api/lyrics?title=${encodeURIComponent(track.title)}&artist=${encodeURIComponent(track.artist)}`
      );
      if (res.ok) {
        const data = await res.json();
        const synced = parseSynced(data.syncedLyrics);
        setLyrics({
          plain: data.plainLyrics,
          synced,
          instrumental: data.instrumental,
        });
      } else {
        setLyrics(null);
      }
    } catch {
      setLyrics(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!currentTrack) return;
    if (currentTrack.id === prevTrackId.current) return;
    prevTrackId.current = currentTrack.id;
    fetchLyrics(currentTrack);
  }, [currentTrack?.id, fetchLyrics]);

  // Update active line based on playback time
  useEffect(() => {
    if (!lyrics?.synced?.length || !currentTime) return;
    let idx = 0;
    for (let i = 0; i < lyrics.synced.length; i++) {
      if (lyrics.synced[i].time <= currentTime) idx = i;
    }
    setActiveIdx(idx);
  }, [currentTime, lyrics]);

  // Scroll active line into view
  useEffect(() => {
    if (activeRef.current && containerRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeIdx]);

  if (!currentTrack) {
    return (
      <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', padding: '24px 0', fontSize: '13px' }}>
        <Mic2 size={24} style={{ marginBottom: '8px', display: 'block', margin: '0 auto 8px' }} />
        No song playing
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', padding: '24px 0', fontSize: '13px' }}>
        <div style={{
          width: 20, height: 20, borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.1)',
          borderTopColor: 'rgba(255,255,255,0.4)',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 10px',
        }} />
        Loading lyrics…
        <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
      </div>
    );
  }

  if (lyrics?.instrumental) {
    return (
      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <Music2 size={24} color="rgba(255,255,255,0.3)" style={{ marginBottom: '8px', display: 'block', margin: '0 auto 8px' }} />
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>Instrumental track</div>
      </div>
    );
  }

  if (!lyrics?.synced?.length && !lyrics?.plain) {
    return (
      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <Mic2 size={24} color="rgba(255,255,255,0.2)" style={{ display: 'block', margin: '0 auto 8px' }} />
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>Lyrics not found</div>
      </div>
    );
  }

  // Synced lyrics view
  if (lyrics.synced.length > 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', height: '100%' }}>
        {/* Font Controls */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', paddingBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '6px', flexShrink: 0 }}>
          <button
            onClick={() => setFontSize(prev => Math.max(12, prev - 2))}
            style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            title="Decrease text size"
          >
            A-
          </button>
          <button
            onClick={() => setFontSize(prev => Math.min(24, prev + 2))}
            style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            title="Increase text size"
          >
            A+
          </button>
        </div>

        <div
          ref={containerRef}
          style={{
            overflowY: 'auto',
            flex: 1,
            padding: '8px 4px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          {lyrics.synced.map((line, i) => {
            const isActive = i === activeIdx;
            const isPast = i < activeIdx;
            return (
              <div
                key={i}
                ref={isActive ? activeRef : null}
                style={{
                  padding: '6px 8px',
                  borderRadius: '10px',
                  fontSize: isActive ? `${fontSize + 2}px` : `${fontSize}px`,
                  fontWeight: isActive ? 700 : 400,
                  fontFamily: isActive ? "'Instrument Serif', serif" : "'Inter', sans-serif",
                  color: isActive
                    ? '#fff'
                    : isPast
                      ? 'rgba(255,255,255,0.35)'
                      : 'rgba(255,255,255,0.5)',
                  lineHeight: 1.5,
                  transition: 'all 0.3s ease',
                  transform: isActive ? 'scale(1.02)' : 'scale(1)',
                  background: isActive ? 'rgba(255,255,255,0.04)' : 'transparent',
                  cursor: 'default',
                }}
              >
                {line.text || '\u2006'}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Plain lyrics fallback
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', height: '100%' }}>
      {/* Font Controls */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', paddingBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '6px', flexShrink: 0 }}>
        <button
          onClick={() => setFontSize(prev => Math.max(12, prev - 2))}
          style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          title="Decrease text size"
        >
          A-
        </button>
        <button
          onClick={() => setFontSize(prev => Math.min(24, prev + 2))}
          style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          title="Increase text size"
        >
          A+
        </button>
      </div>

      <div
        ref={containerRef}
        style={{
          overflowY: 'auto',
          flex: 1,
          padding: '4px',
          fontSize: `${fontSize}px`,
          color: 'rgba(255,255,255,0.55)',
          lineHeight: 1.8,
          whiteSpace: 'pre-wrap',
        }}
      >
        {lyrics.plain}
      </div>
    </div>
  );
}
