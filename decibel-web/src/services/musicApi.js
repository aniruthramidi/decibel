// ─────────────────────────────────────────────────────────────────────────────
// Featured Tracks — Full-length royalty-free songs (SoundHelix)
// ─────────────────────────────────────────────────────────────────────────────
export const FEATURED_TRACKS = [
  {
    id: 'featured-1',
    title: 'Neon Horizon',
    artist: 'Sentinel One',
    album: 'Retro Future',
    cover: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    duration: 372,
    source: 'featured',
  },
  {
    id: 'featured-2',
    title: 'Midnight Drive',
    artist: 'Lofi Chills',
    album: 'Sleepy Streets',
    cover: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    duration: 344,
    source: 'featured',
  },
  {
    id: 'featured-3',
    title: 'Cyberpunk Odyssey',
    artist: 'Digital Ghost',
    album: 'Grid Runner',
    cover: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    duration: 362,
    source: 'featured',
  },
  {
    id: 'featured-4',
    title: 'Solar Winds',
    artist: 'Aether Echoes',
    album: 'Deep Cosmos',
    cover: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=500&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    duration: 318,
    source: 'featured',
  },
];

const FALLBACK_COVER =
  'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&auto=format&fit=crop&q=80';

// ─────────────────────────────────────────────────────────────────────────────
// 0. YouTube Music — Python ytmusicapi backend (http://localhost:8000)
//    Full-length songs from the complete YouTube Music catalog.
//    Works in guest mode (search-only) or OAuth mode (playlists too).
//    Start the backend: cd server && python main.py
// ─────────────────────────────────────────────────────────────────────────────
export async function searchYouTubeMusicTracks(query) {
  if (!query?.trim()) return [];
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=25`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return (data.tracks || []).map((t) => ({ ...t, source: 'youtube' }));
  } catch (err) {
    // Server not running — silently skip (other sources will still work)
    console.warn('[YT Music] Backend unavailable:', err.message);
    return [];
  }
}

/** Fetch YouTube Music trending / home feed tracks */
export async function fetchTrendingTracks() {
  try {
    const res = await fetch('/api/trending');
    if (!res.ok) return FEATURED_TRACKS;
    const data = await res.json();
    const tracks = (data.tracks || []).map((t) => ({ ...t, source: 'youtube' }));
    return tracks.length > 0 ? tracks : FEATURED_TRACKS;
  } catch {
    return FEATURED_TRACKS;
  }
}

function getSessionEmail() {
  try {
    const sessionStr = localStorage.getItem('decibel_session');
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      return session.email || 'guest@decibel.app';
    }
  } catch (e) {
    console.error('Error reading session email', e);
  }
  return 'guest@decibel.app';
}

/**
 * YouTube Music playlist management — all require OAuth in server/oauth.json
 * Run `ytmusicapi oauth` inside the server/ folder to set up OAuth.
 */
export const ytPlaylists = {
  async list() {
    const email = getSessionEmail();
    const res = await fetch(`/api/playlists?email=${encodeURIComponent(email)}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  async create(title, description = '') {
    const email = getSessionEmail();
    const res = await fetch(`/api/playlists?email=${encodeURIComponent(email)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  async addItems(playlistId, track) {
    const res = await fetch(`/api/playlists/${playlistId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoId: track.videoId,
        title: track.title,
        artist: track.artist,
        album: track.album || '',
        cover: track.cover || '',
        duration: track.duration || 0
      }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  async getPlaylist(playlistId) {
    const res = await fetch(`/api/playlist/${playlistId}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  async delete(playlistId) {
    const res = await fetch(`/api/playlists/${playlistId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. Audius — Decentralised, full-length streams, no API key required
// ─────────────────────────────────────────────────────────────────────────────
let _audiusHost = 'https://discoveryprovider.audius.co';

async function resolveAudiusHost() {
  try {
    const res = await fetch('https://api.audius.co');
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.data) && json.data.length > 0) {
        _audiusHost = json.data[Math.floor(Math.random() * json.data.length)];
      }
    }
  } catch { /* keep default */ }
  return _audiusHost;
}

export async function searchAudiusTracks(query) {
  if (!query?.trim()) return [];
  try {
    const host = await resolveAudiusHost();
    const res = await fetch(
      `${host}/v1/tracks/search?query=${encodeURIComponent(query)}&app_name=DECIBEL_MUSIC_PLAYER`
    );
    if (!res.ok) throw new Error('Audius error');
    const json = await res.json();

    return (json.data || [])
      .filter((t) => t.duration > 60)
      .map((t) => ({
        id: `audius_${t.id}`,
        title: t.title || 'Unknown Track',
        artist: t.user?.name || 'Unknown Artist',
        album: 'Audius',
        cover: t.artwork?.['480x480'] || t.artwork?.['150x150'] || FALLBACK_COVER,
        audioUrl: `${host}/v1/tracks/${t.id}/stream?app_name=DECIBEL_MUSIC_PLAYER`,
        duration: Math.round(t.duration),
        source: 'audius',
        trackViewUrl: t.permalink,
      }));
  } catch (err) {
    console.error('[Audius] Search failed:', err);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Internet Archive — Public domain & CC full-length audio, no API key
// ─────────────────────────────────────────────────────────────────────────────
export async function searchArchiveTracks(query) {
  if (!query?.trim()) return [];
  try {
    const searchRes = await fetch(
      `https://archive.org/advancedsearch.php?` +
        new URLSearchParams({
          q: `${query} AND mediatype:audio`,
          'fl[]': 'identifier,title,creator,downloads',
          sort: 'downloads desc',
          rows: '20',
          output: 'json',
        })
    );
    if (!searchRes.ok) throw new Error('Archive search error');
    const searchData = await searchRes.json();
    const items = (searchData.response?.docs || []).slice(0, 10);

    const resolved = await Promise.allSettled(
      items.map(async (item) => {
        const metaRes = await fetch(`https://archive.org/metadata/${item.identifier}`);
        if (!metaRes.ok) return null;
        const meta = await metaRes.json();
        const files = meta.files || [];

        const mp3 =
          files.find(
            (f) => f.name?.toLowerCase().endsWith('.mp3') &&
              f.source === 'original' &&
              parseFloat(f.length || 0) > 60
          ) ||
          files.find(
            (f) => f.name?.toLowerCase().endsWith('.mp3') &&
              parseFloat(f.length || 0) > 60
          );

        if (!mp3) return null;

        return {
          id: `archive_${item.identifier}`,
          title: meta.metadata?.title || item.title || 'Unknown Track',
          artist:
            (Array.isArray(meta.metadata?.creator)
              ? meta.metadata.creator[0]
              : meta.metadata?.creator) ||
            item.creator ||
            'Unknown Artist',
          album: 'Internet Archive',
          cover: `https://archive.org/services/img/${item.identifier}`,
          audioUrl: `https://archive.org/download/${item.identifier}/${encodeURIComponent(mp3.name)}`,
          duration: Math.round(parseFloat(mp3.length || 180)),
          source: 'archive',
          trackViewUrl: `https://archive.org/details/${item.identifier}`,
        };
      })
    );

    return resolved
      .filter((r) => r.status === 'fulfilled' && r.value !== null)
      .map((r) => r.value);
  } catch (err) {
    console.error('[Archive.org] Search failed:', err);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Master unified search — FULL-LENGTH SONGS ONLY
// Priority: YouTube Music (ytmusicapi) → Audius → Internet Archive
// ─────────────────────────────────────────────────────────────────────────────
const searchCache = {};

export async function searchAllFreeSources(query) {
  if (!query?.trim()) return FEATURED_TRACKS;

  const cacheKey = query.trim().toLowerCase();
  if (searchCache[cacheKey]) {
    console.log('[musicApi] Returning cached results for:', query);
    return searchCache[cacheKey];
  }

  const [ytResult, audiusResult, archiveResult] = await Promise.allSettled([
    searchYouTubeMusicTracks(query),   // YouTube Music (full songs, best catalog)
    searchAudiusTracks(query),          // Audius (indie / electronic)
    searchArchiveTracks(query),         // Internet Archive (public domain)
  ]);

  const combined = [
    ...(ytResult.status === 'fulfilled' ? ytResult.value : []),
    ...(audiusResult.status === 'fulfilled' ? audiusResult.value : []),
    ...(archiveResult.status === 'fulfilled' ? archiveResult.value : []),
  ];

  const seen = new Set();
  const unique = combined.filter((t) => {
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });

  const finalResult = unique.length > 0 ? unique : FEATURED_TRACKS;
  searchCache[cacheKey] = finalResult;
  return finalResult;
}
