import { useEffect, useRef, useState, useCallback } from 'react';

let ytApiLoaded = false;
let ytApiLoading = false;
const ytReadyCallbacks = [];

/** Load the YouTube IFrame API script once globally */
function loadYouTubeAPI() {
  if (ytApiLoaded || ytApiLoading) return;
  ytApiLoading = true;

  window.onYouTubeIframeAPIReady = () => {
    ytApiLoaded = true;
    ytApiLoading = false;
    ytReadyCallbacks.forEach((cb) => cb());
    ytReadyCallbacks.length = 0;
  };

  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);
}

function onYTReady(cb) {
  if (ytApiLoaded && window.YT?.Player) {
    cb();
  } else {
    ytReadyCallbacks.push(cb);
    loadYouTubeAPI();
  }
}

export default function useYouTubePlayer({ onEnded, onTimeUpdate } = {}) {
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const intervalRef = useRef(null);

  const startPolling = useCallback(() => {
    stopPolling();
    intervalRef.current = setInterval(() => {
      const p = playerRef.current;
      if (!p?.getCurrentTime) return;
      try {
        const ct = p.getCurrentTime() || 0;
        const dur = p.getDuration() || 0;
        setCurrentTime(ct);
        setDuration(dur);
        onTimeUpdate?.(ct, dur);
      } catch {
        // player may not be ready yet
      }
    }, 500);
  }, [onTimeUpdate]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Create / mount the hidden player div
  useEffect(() => {
    const containerId = 'yt-iframe-container';
    let container = document.getElementById(containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      container.style.cssText =
        'position:fixed;width:1px;height:1px;top:0;left:0;overflow:hidden;pointer-events:none;opacity:0;z-index:-1;';
      document.body.appendChild(container);
    }

    const playerId = 'yt-iframe-player';
    if (!document.getElementById(playerId)) {
      const el = document.createElement('div');
      el.id = playerId;
      container.appendChild(el);
    }

    containerRef.current = container;

    onYTReady(() => {
      if (playerRef.current) {
        setIsReady(true);
        return;
      }
      playerRef.current = new window.YT.Player(playerId, {
        height: '1',
        width: '1',
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          rel: 0,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: () => setIsReady(true),
          onStateChange: (e) => {
            const state = e.data;
            if (state === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              startPolling();
            } else if (
              state === window.YT.PlayerState.PAUSED ||
              state === window.YT.PlayerState.BUFFERING
            ) {
              setIsPlaying(false);
              stopPolling();
            } else if (state === window.YT.PlayerState.ENDED) {
              setIsPlaying(false);
              stopPolling();
              setCurrentTime(0);
              onEnded?.();
            }
          },
        },
      });
    });

    return () => {
      stopPolling();
    };
  }, []);

  const loadVideo = useCallback((videoId) => {
    const player = playerRef.current;
    if (!player) {
      console.warn('[YouTubePlayer] Player not initialized yet');
      return;
    }
    try {
      player.loadVideoById(videoId);
      setCurrentTime(0);
      // Some browsers need an explicit play call after load
      setTimeout(() => {
        try { player.playVideo(); } catch {}
      }, 300);
    } catch (err) {
      console.error('[YouTubePlayer] loadVideo failed:', err);
    }
  }, []);

  const play = useCallback(() => {
    try { playerRef.current?.playVideo(); } catch {}
  }, []);

  const pause = useCallback(() => {
    try { playerRef.current?.pauseVideo(); } catch {}
  }, []);

  const seekTo = useCallback((seconds) => {
    try {
      playerRef.current?.seekTo(seconds, true);
      setCurrentTime(seconds);
    } catch {}
  }, []);

  const setVolume = useCallback((vol /* 0–1 */) => {
    try { playerRef.current?.setVolume(vol * 100); } catch {}
  }, []);

  const mute = useCallback(() => { try { playerRef.current?.mute(); } catch {} }, []);
  const unmute = useCallback(() => { try { playerRef.current?.unMute(); } catch {} }, []);

  return {
    isReady,
    isPlaying,
    currentTime,
    duration,
    loadVideo,
    play,
    pause,
    seekTo,
    setVolume,
    mute,
    unmute,
  };
}
