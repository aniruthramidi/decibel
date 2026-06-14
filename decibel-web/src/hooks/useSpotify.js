import { useState, useEffect } from 'react';

// Cryptographic helpers for PKCE
function generateRandomString(length) {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

async function generateCodeChallenge(codeVerifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode.apply(null, new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export default function useSpotify() {
  const [clientId, setClientId] = useState(() => localStorage.getItem('spotify_client_id') || '');
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('spotify_access_token') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [spotifyPlaylists, setSpotifyPlaylists] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Validate state
  useEffect(() => {
    if (accessToken) {
      setIsAuthenticated(true);
      fetchProfile(accessToken);
      fetchPlaylists(accessToken);
    } else {
      setIsAuthenticated(false);
      setUserProfile(null);
    }
  }, [accessToken]);

  // Read URL for OAuth callback code
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      exchangeCodeForToken(code);
    }
  }, []);

  const saveClientId = (id) => {
    setClientId(id);
    localStorage.setItem('spotify_client_id', id);
  };

  const login = async () => {
    if (!clientId) {
      alert('Please enter your Spotify Client ID in settings first!');
      return;
    }

    setIsLoading(true);
    try {
      const codeVerifier = generateRandomString(128);
      sessionStorage.setItem('spotify_code_verifier', codeVerifier);

      const codeChallenge = await generateCodeChallenge(codeVerifier);
      const redirectUri = window.location.origin;
      const scopes = 'user-read-private user-read-email user-library-read user-read-playback-state user-modify-playback-state';

      const authUrl = new URL('https://accounts.spotify.com/authorize');
      authUrl.search = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        scope: scopes,
        redirect_uri: redirectUri,
        code_challenge_method: 'S256',
        code_challenge: codeChallenge,
      }).toString();

      window.location.href = authUrl.toString();
    } catch (err) {
      console.error('Spotify login setup failed:', err);
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
    localStorage.removeItem('spotify_token_expiry');
    setAccessToken('');
    setIsAuthenticated(false);
    setUserProfile(null);
    setSpotifyPlaylists([]);
  };

  const exchangeCodeForToken = async (code) => {
    setIsLoading(true);
    const codeVerifier = sessionStorage.getItem('spotify_code_verifier');
    const redirectUri = window.location.origin;
    const cid = clientId || localStorage.getItem('spotify_client_id');

    if (!codeVerifier || !cid) {
      console.error('Missing code_verifier or client_id for token exchange');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: cid,
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: redirectUri,
          code_verifier: codeVerifier,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to exchange auth token');
      }

      const data = await response.json();
      const expiryTime = Date.now() + data.expires_in * 1000;

      localStorage.setItem('spotify_access_token', data.access_token);
      localStorage.setItem('spotify_refresh_token', data.refresh_token);
      localStorage.setItem('spotify_token_expiry', expiryTime.toString());

      setAccessToken(data.access_token);
    } catch (err) {
      console.error('Error exchanging token:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProfile = async (token) => {
    try {
      const res = await fetch('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const profile = await res.json();
        setUserProfile(profile);
      } else if (res.status === 401) {
        logout(); // Token expired or invalid
      }
    } catch (err) {
      console.error('Error fetching Spotify profile:', err);
    }
  };

  const fetchPlaylists = async (token) => {
    try {
      const res = await fetch('https://api.spotify.com/v1/me/playlists?limit=10', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSpotifyPlaylists(data.items || []);
      }
    } catch (err) {
      console.error('Error fetching Spotify playlists:', err);
    }
  };

  const searchSpotify = async (query) => {
    if (!accessToken || !query) return [];
    try {
      const res = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=20`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (!res.ok) return [];
      const data = await res.json();
      return (data.tracks?.items || []).map((track) => ({
        id: track.id,
        title: track.name,
        artist: track.artists.map((a) => a.name).join(', '),
        album: track.album.name,
        cover: track.album.images[0]?.url || '',
        audioUrl: track.preview_url, // Spotify preview URL (30s)
        duration: Math.round(track.duration_ms / 1000),
        source: 'spotify',
        uri: track.uri
      }));
    } catch (err) {
      console.error('Error searching Spotify:', err);
      return [];
    }
  };

  return {
    clientId,
    accessToken,
    isAuthenticated,
    userProfile,
    spotifyPlaylists,
    isLoading,
    saveClientId,
    login,
    logout,
    searchSpotify,
  };
}
