import { useState, useEffect, useRef } from 'react';

export default function useAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [trackQueue, setTrackQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [repeatMode, setRepeatMode] = useState('off'); // 'off' | 'one' | 'all'
  const [isShuffled, setIsShuffled] = useState(false);

  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const originalQueueRef = useRef([]);

  // Initialize Audio Element (robust SSR check)
  if (!audioRef.current && typeof window !== 'undefined') {
    const audio = new Audio();
    audioRef.current = audio;
  }

  // Cleanup on unmount (memory leak prevention)
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(err => console.warn('Error closing AudioContext:', err));
      }
    };
  }, []);

  const currentTrack = currentIndex >= 0 && currentIndex < trackQueue.length ? trackQueue[currentIndex] : null;

  // Initialize Web Audio API Analyser
  const initAnalyser = () => {
    if (audioContextRef.current) return;
    if (typeof window === 'undefined') return;

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256; // 128 frequency bins

      // Create source node once and connect it
      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      sourceRef.current = source;
    } catch (err) {
      console.warn('Web Audio API not fully supported or blocked by browser policies:', err);
    }
  };

  // Synchronize play queue tracks
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onEnded = () => handleNext();

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, [currentIndex, trackQueue, repeatMode]);

  // Load new track when index changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentTrack && currentTrack.audioUrl) {
      // Pause current playback first
      audio.pause();
      audio.src = currentTrack.audioUrl;
      audio.load();
      
      // Attempt to play
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            // Initialize Web Audio on first play gesture
            initAnalyser();
            if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
              audioContextRef.current.resume();
            }
          })
          .catch((err) => {
            console.error('Audio play failed:', err);
            setIsPlaying(false);
          });
      }
    } else if (currentTrack && !currentTrack.audioUrl) {
      // YouTube / IFrame track — mute the HTML audio element, let YT player handle playback
      audio.pause();
      audio.src = '';
      // Don't set isPlaying here — the YT player state will handle it
    } else {
      audio.src = '';
      setIsPlaying(false);
    }
  }, [currentIndex]);

  // Synchronize volume and mute states
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Actions
  const playTrack = (track, queueList = []) => {
    if (!track) return;
    
    // Find if track is already in the provided queue
    const indexInQueue = queueList.findIndex((t) => t.id === track.id);
    
    let newQueue = [...queueList];
    if (indexInQueue === -1) {
      if (!newQueue.some(t => t.id === track.id)) {
        newQueue.push(track);
      }
    }
    
    if (isShuffled) {
      originalQueueRef.current = [...newQueue];
      const shuffled = [...newQueue];
      const targetTrackId = track.id;
      // Fisher-Yates shuffle
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      const targetIdx = shuffled.findIndex(t => t.id === targetTrackId);
      setTrackQueue(shuffled);
      setCurrentIndex(targetIdx !== -1 ? targetIdx : 0);
    } else {
      originalQueueRef.current = [...newQueue];
      setTrackQueue(newQueue);
      setCurrentIndex(newQueue.findIndex(t => t.id === track.id));
    }
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    // Initialize Web Audio
    initAnalyser();
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(err => console.error(err));
      setIsPlaying(true);
    }
  };

  const handleNext = () => {
    if (trackQueue.length === 0) return;
    
    if (repeatMode === 'one' && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => console.error(err));
      setCurrentTime(0);
      setIsPlaying(true);
      return;
    }

    setCurrentIndex((prevIndex) => {
      const nextIndex = prevIndex + 1;
      if (nextIndex < trackQueue.length) {
        return nextIndex;
      } else {
        if (repeatMode === 'all') {
          return 0; // Loop to start
        } else {
          setIsPlaying(false);
          return -1; // Stop playback
        }
      }
    });
  };

  const handlePrev = () => {
    if (trackQueue.length === 0) return;
    setCurrentIndex((prevIndex) => {
      const nextIndex = prevIndex - 1;
      return nextIndex >= 0 ? nextIndex : trackQueue.length - 1; // Loop to end
    });
  };

  const seek = (time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const toggleShuffle = () => {
    if (isShuffled) {
      const currentTrackId = currentTrack?.id;
      setTrackQueue(originalQueueRef.current);
      if (currentTrackId) {
        const idx = originalQueueRef.current.findIndex(t => t.id === currentTrackId);
        if (idx !== -1) setCurrentIndex(idx);
      }
      setIsShuffled(false);
    } else {
      originalQueueRef.current = [...trackQueue];
      if (trackQueue.length > 1) {
        const shuffled = [...trackQueue];
        const currentTrackId = currentTrack?.id;
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        setTrackQueue(shuffled);
        if (currentTrackId) {
          const idx = shuffled.findIndex(t => t.id === currentTrackId);
          if (idx !== -1) setCurrentIndex(idx);
        }
      }
      setIsShuffled(true);
    }
  };

  const toggleRepeat = () => {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  };

  return {
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    currentTrack,
    trackQueue,
    currentIndex,
    repeatMode,
    isShuffled,
    analyser: analyserRef.current,
    setVolume,
    setIsMuted,
    playTrack,
    togglePlay,
    next: handleNext,
    prev: handlePrev,
    seek,
    toggleShuffle,
    toggleRepeat,
  };
}
