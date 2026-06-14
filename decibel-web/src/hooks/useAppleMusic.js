import { useState, useEffect } from 'react';

export default function useAppleMusic() {
  const [developerToken, setDeveloperToken] = useState(() => localStorage.getItem('apple_developer_token') || '');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [musicInstance, setMusicInstance] = useState(null);
  const [isMusicKitLoaded, setIsMusicKitLoaded] = useState(false);

  // Poll for MusicKit library loading on window
  useEffect(() => {
    const checkMusicKit = () => {
      if (window.MusicKit) {
        setIsMusicKitLoaded(true);
        if (developerToken) {
          initMusicKit(developerToken);
        }
      } else {
        setTimeout(checkMusicKit, 500);
      }
    };
    checkMusicKit();
  }, []);

  const saveDeveloperToken = (token) => {
    setDeveloperToken(token);
    localStorage.setItem('apple_developer_token', token);
    if (isMusicKitLoaded && token) {
      initMusicKit(token);
    }
  };

  const initMusicKit = async (token) => {
    try {
      if (!window.MusicKit) return;

      // Configure MusicKit JS instance
      const music = await window.MusicKit.configure({
        developerToken: token,
        app: {
          name: 'Decibel Web Streamer',
          build: '1.0.0',
        },
      });

      setMusicInstance(music);
      setIsAuthorized(music.isAuthorized);

      // Listen for authorization changes
      music.addEventListener(window.MusicKit.Events.authorizationStatusDidChange, () => {
        setIsAuthorized(music.isAuthorized);
      });
    } catch (err) {
      console.error('Failed to configure MusicKit JS:', err);
    }
  };

  const login = async () => {
    if (!musicInstance) {
      alert('Please enter a valid Apple Developer Token in settings first!');
      return;
    }
    try {
      await musicInstance.authorize();
      setIsAuthorized(true);
    } catch (err) {
      console.error('Apple Music authorization failed:', err);
    }
  };

  const logout = async () => {
    if (!musicInstance) return;
    try {
      await musicInstance.unauthorize();
      setIsAuthorized(false);
    } catch (err) {
      console.error('Apple Music logout failed:', err);
    }
  };

  const searchAppleMusic = async (query) => {
    if (!musicInstance || !query) return [];
    try {
      const result = await musicInstance.api.music(`/v1/catalog/us/search`, {
        term: query,
        types: 'songs',
        limit: 20
      });
      
      const songs = result.data.results.songs?.data || [];
      return songs.map((song) => {
        // Map size in artwork
        const artworkUrl = song.attributes.artwork?.url || '';
        const cover = artworkUrl
          ? artworkUrl.replace('{w}', '500').replace('{h}', '500')
          : 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&auto=format&fit=crop&q=80';
          
        return {
          id: song.id,
          title: song.attributes.name,
          artist: song.attributes.artistName,
          album: song.attributes.albumName,
          cover: cover,
          audioUrl: song.attributes.previews?.[0]?.url || '', // Apple Music 30s preview URL
          duration: Math.round((song.attributes.durationInMillis || 0) / 1000),
          source: 'applemusic',
          url: song.attributes.url
        };
      });
    } catch (err) {
      console.error('Error searching Apple Music:', err);
      return [];
    }
  };

  return {
    developerToken,
    isAuthorized,
    isMusicKitLoaded,
    musicInstance,
    saveDeveloperToken,
    login,
    logout,
    searchAppleMusic,
  };
}
