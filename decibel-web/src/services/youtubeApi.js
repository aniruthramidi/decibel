// ─────────────────────────────────────────────────────────────────────────────
// YouTube Music Search — YouTube Data API v3
// Set VITE_YOUTUBE_API_KEY in .env.local
// Get a free key: https://console.cloud.google.com/apis/library/youtube.googleapis.com
// ─────────────────────────────────────────────────────────────────────────────

const YT_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const YT_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';
const YT_VIDEOS_URL = 'https://www.googleapis.com/youtube/v3/videos';

const FALLBACK_COVER =
  'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&auto=format&fit=crop&q=80';

/**
 * Search YouTube for music videos.
 * Returns tracks with source:'youtube' and videoId field for IFrame playback.
 */
export async function searchYouTubeTracks(query) {
  if (!query?.trim()) return [];
  if (!YT_API_KEY) {
    console.warn('[YouTube] No API key set. Add VITE_YOUTUBE_API_KEY to .env.local');
    return [];
  }

  try {
    // Step 1: Search for music videos
    const searchParams = new URLSearchParams({
      key: YT_API_KEY,
      q: `${query} official music`,
      type: 'video',
      videoCategoryId: '10', // Music category
      part: 'snippet',
      maxResults: '25',
      videoEmbeddable: 'true',
      safeSearch: 'none',
    });

    const searchRes = await fetch(`${YT_SEARCH_URL}?${searchParams}`);
    if (!searchRes.ok) {
      const err = await searchRes.json();
      throw new Error(err.error?.message || 'YouTube search failed');
    }
    const searchData = await searchRes.json();
    const items = searchData.items || [];
    if (items.length === 0) return [];

    // Step 2: Get video durations to filter out shorts/previews (keep > 60s)
    const videoIds = items.map((i) => i.id?.videoId).filter(Boolean).join(',');
    const detailsParams = new URLSearchParams({
      key: YT_API_KEY,
      id: videoIds,
      part: 'contentDetails,statistics',
    });

    const detailsRes = await fetch(`${YT_VIDEOS_URL}?${detailsParams}`);
    const detailsData = detailsRes.ok ? await detailsRes.json() : { items: [] };

    // Map videoId → duration in seconds
    const durationMap = {};
    for (const v of detailsData.items || []) {
      const iso = v.contentDetails?.duration || 'PT0S';
      durationMap[v.id] = parseDuration(iso);
    }

    return items
      .map((item) => {
        const videoId = item.id?.videoId;
        if (!videoId) return null;

        const duration = durationMap[videoId] || 0;
        if (duration < 60) return null; // Skip shorts / previews

        const snippet = item.snippet;
        const thumb =
          snippet.thumbnails?.maxres?.url ||
          snippet.thumbnails?.high?.url ||
          snippet.thumbnails?.medium?.url ||
          FALLBACK_COVER;

        // Parse "Artist - Title" pattern from video title
        const rawTitle = snippet.title || 'Unknown';
        const channelName = snippet.channelTitle || 'YouTube';
        const { title, artist } = parseYouTubeTitle(rawTitle, channelName);

        return {
          id: `youtube_${videoId}`,
          videoId,
          title,
          artist,
          album: 'YouTube Music',
          cover: thumb,
          audioUrl: null, // YouTube tracks play via IFrame, not audio element
          duration,
          source: 'youtube',
          trackViewUrl: `https://www.youtube.com/watch?v=${videoId}`,
        };
      })
      .filter(Boolean);
  } catch (err) {
    console.error('[YouTube] Search failed:', err);
    return [];
  }
}

/** Parse ISO 8601 duration (PT4M33S) to seconds */
function parseDuration(iso) {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const h = parseInt(match[1] || '0');
  const m = parseInt(match[2] || '0');
  const s = parseInt(match[3] || '0');
  return h * 3600 + m * 60 + s;
}

/** Try to split "Artist - Song Title (Official)" into artist + title */
function parseYouTubeTitle(raw, channelName) {
  // Remove common suffixes
  let clean = raw
    .replace(/\(Official (Video|Audio|Music Video|Lyric Video|Visualizer)\)/gi, '')
    .replace(/\[Official.*?\]/gi, '')
    .replace(/\(Lyric.*?\)/gi, '')
    .replace(/\(Audio\)/gi, '')
    .replace(/\(4K\)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  const separator = clean.includes(' - ') ? ' - ' : clean.includes(' – ') ? ' – ' : null;
  if (separator) {
    const [artistPart, ...rest] = clean.split(separator);
    return { artist: artistPart.trim(), title: rest.join(separator).trim() };
  }

  return { artist: channelName, title: clean };
}
