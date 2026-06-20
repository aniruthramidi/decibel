import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

import Sidebar from './components/Sidebar';
import Player from './components/Player';
import VinylPlayer from './components/VinylPlayer';
import Equalizer from './components/Equalizer';
import OAuthConnect from './components/OAuthConnect';
import TrackList from './components/TrackList';
import BackgroundVideo from './components/BackgroundVideo';
import YTPlaylists from './components/YTPlaylists';
import LoginPage, { getSession, clearSession } from './components/LoginPage';
import AccountTab from './components/AccountTab';
import Lyrics from './components/Lyrics';
import Recommendations from './components/Recommendations';
import { supabase } from './services/supabaseClient';


import useAudio from './hooks/useAudio';
import useColorExtractor from './hooks/useColorExtractor';
import useSpotify from './hooks/useSpotify';
import useAppleMusic from './hooks/useAppleMusic';
import useYouTubePlayer from './hooks/useYouTubePlayer';
import { FEATURED_TRACKS, searchAllFreeSources, fetchTrendingTracks } from './services/musicApi';

import { Search, Heart, Music, ListMusic, Trash2, Library, Sparkles, X, LogOut, Play } from 'lucide-react';

export default function App() {
  // ── Auth ──────────────────────────────────────────────────────────────
  const [session, setSession] = useState(() => getSession());

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (initialSession) {
        setSession({
          name: initialSession.user.user_metadata?.name || initialSession.user.email.split('@')[0],
          email: initialSession.user.email,
          email_verified: initialSession.user.email_confirmed_at ? true : false,
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (currentSession) {
        setSession({
          name: currentSession.user.user_metadata?.name || currentSession.user.email.split('@')[0],
          email: currentSession.user.email,
          email_verified: currentSession.user.email_confirmed_at ? true : false,
        });
      } else {
        setSession(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);


  // ── App state ─────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(FEATURED_TRACKS);
  const [isSearching, setIsSearching] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);

  const [libraryTracks, setLibraryTracks] = useState(() => {
    const saved = localStorage.getItem('decibel_library');
    return saved ? JSON.parse(saved) : [];
  });

  // Track play count for stats
  const bumpPlayCount = () => {
    const n = parseInt(localStorage.getItem('decibel_tracks_played') || '0', 10);
    localStorage.setItem('decibel_tracks_played', String(n + 1));
  };

  // ── Audio engines ─────────────────────────────────────────────────────
  const audio = useAudio();
  const spotify = useSpotify();
  const apple = useAppleMusic();

  // YouTube IFrame player (handles tracks with source:'youtube')
  const ytPlayer = useYouTubePlayer({
    onEnded: () => audio.next(),
  });

  // Route playback: YouTube tracks → IFrame; everything else → HTMLAudio
  const isYouTubeTrack = audio.currentTrack?.source === 'youtube';

  // Load YouTube video when track changes OR when player becomes ready
  useEffect(() => {
    if (!isYouTubeTrack) return;
    if (!audio.currentTrack?.videoId) return;
    if (!ytPlayer.isReady) return;

    // loadVideoById automatically starts playing in YT IFrame API
    ytPlayer.loadVideo(audio.currentTrack.videoId);
    // Sync volume immediately
    ytPlayer.setVolume(audio.isMuted ? 0 : audio.volume);
  }, [audio.currentTrack?.id, ytPlayer.isReady]);

  // Sync volume to YouTube player
  useEffect(() => {
    if (audio.isMuted) ytPlayer.mute();
    else { ytPlayer.unmute(); ytPlayer.setVolume(audio.volume); }
  }, [audio.volume, audio.isMuted]);

  // Load trending on first mount
  useEffect(() => {
    fetchTrendingTracks().then((tracks) => {
      if (tracks && tracks.length > 0) setSearchResults(tracks);
    });
  }, []);


  useColorExtractor(audio.currentTrack?.cover);

  useEffect(() => {
    localStorage.setItem('decibel_library', JSON.stringify(libraryTracks));
  }, [libraryTracks]);

  const toggleLibraryTrack = (track) => {
    setLibraryTracks((prev) =>
      prev.some((t) => t.id === track.id)
        ? prev.filter((t) => t.id !== track.id)
        : [track, ...prev]
    );
  };

  const playQueueTrack = (track) => {
    audio.playTrack(track, audio.trackQueue);
  };

  // Enhanced playTrack that also bumps stats
  const playTrackWithStats = (track, queue) => {
    bumpPlayCount();
    audio.playTrack(track, queue);
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const freePromise = searchAllFreeSources(searchQuery);
      const oauthPromises = [];
      if (spotify.isAuthenticated) oauthPromises.push(spotify.searchSpotify(searchQuery).catch(() => []));
      if (apple.isAuthorized) oauthPromises.push(apple.searchAppleMusic(searchQuery).catch(() => []));

      const [freeResults, ...oauthResults] = await Promise.all([freePromise, ...oauthPromises]);
      const combined = [...oauthResults.flat(), ...freeResults];

      const seen = new Set();
      const unique = combined.filter((t) => {
        if (seen.has(t.id)) return false;
        seen.add(t.id);
        return true;
      });

      setSearchResults(unique.length > 0 ? unique : FEATURED_TRACKS);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {!session ? (
        <LoginPage key="login" onAuthenticated={(user) => setSession(user)} />
      ) : (
    <div key="app" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
      position: 'relative',
      background: '#000',
      userSelect: 'none',
    }}>
      {/* ── Fullscreen HLS Background Video ── */}
      <BackgroundVideo />

      {/* ── Dynamic colour glow from track art ── */}
      <div className="dynamic-backdrop" style={{ zIndex: 1 }} />

      {/* ── Top Glassmorphism Navbar ── */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        spotifyAuth={spotify.isAuthenticated}
        appleAuth={apple.isAuthorized}
        session={session}
        onLogout={async () => {
          await supabase.auth.signOut();
          clearSession();
          setSession(null);
        }}
        isPlaying={isYouTubeTrack ? ytPlayer?.isPlaying : audio.isPlaying}
      />

      {/* ── Main scrollable content area ── */}
      <main style={{
        position: 'relative',
        zIndex: 10,
        flex: 1,
        overflowY: 'auto',
        padding: '28px 32px',
        display: 'flex',
        gap: '32px',
      }}>

        {/* ─────────── TAB: HOME ─────────── */}
        {activeTab === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: 'flex', gap: '28px', width: '100%', flexWrap: 'wrap' }}
          >
            {/* Left: Vinyl player card + Lyrics */}
            <div style={{
              flex: '1.1',
              minWidth: '300px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}>
              <div className="liquid-glass" style={{
                borderRadius: '24px',
                padding: '28px 24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
              }}>
                <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '6px', alignSelf: 'flex-start' }}>
                  <Sparkles size={11} /> Live Player
                </div>

                <VinylPlayer currentTrack={audio.currentTrack} isPlaying={audio.isPlaying} />

                <div style={{ width: '100%' }}>
                  <Equalizer analyser={audio.analyser} isPlaying={audio.isPlaying} />
                </div>

                {/* Track info */}
                {audio.currentTrack && (
                  <div style={{ textAlign: 'center', width: '100%' }}>
                    <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: '20px', color: '#fff', lineHeight: 1.2, marginBottom: '4px' }}>
                      {audio.currentTrack.title}
                    </p>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
                      {audio.currentTrack.artist}
                    </p>
                    <button
                      onClick={() => toggleLibraryTrack(audio.currentTrack)}
                      style={{
                        marginTop: '14px',
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        padding: '8px 18px', borderRadius: '9999px',
                        fontSize: '12px', fontWeight: 500,
                        background: libraryTracks.some((t) => t.id === audio.currentTrack.id)
                          ? 'rgba(var(--theme-glow-rgb), 0.15)'
                          : 'rgba(255,255,255,0.06)',
                        border: `1px solid ${libraryTracks.some((t) => t.id === audio.currentTrack.id)
                          ? 'rgba(var(--theme-glow-rgb), 0.3)'
                          : 'rgba(255,255,255,0.1)'}`,
                        color: libraryTracks.some((t) => t.id === audio.currentTrack.id)
                          ? 'rgb(var(--theme-glow-rgb))' : 'rgba(255,255,255,0.7)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <Heart size={13} fill={libraryTracks.some((t) => t.id === audio.currentTrack.id) ? 'currentColor' : 'none'} />
                      {libraryTracks.some((t) => t.id === audio.currentTrack.id) ? 'Saved' : 'Save'}
                    </button>
                  </div>
                )}

                {!audio.currentTrack && (
                  <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
                    Select a track to start listening
                  </div>
                )}
              </div>

              {/* Lyrics card */}
              {audio.currentTrack && (
                <div className="liquid-glass" style={{
                  borderRadius: '20px',
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  maxHeight: '280px',
                  overflow: 'hidden',
                }}>
                  <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                    <Music size={11} /> Lyrics
                  </div>
                  <Lyrics
                    currentTrack={audio.currentTrack}
                    currentTime={isYouTubeTrack ? ytPlayer?.currentTime : audio.currentTime}
                  />
                </div>
              )}
            </div>

            {/* Right: Greeting + recommendations + featured tracks */}
            <div style={{ flex: '1.8', minWidth: '340px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Greeting */}
              <div className="liquid-glass" style={{ borderRadius: '20px', padding: '24px 28px' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: '6px' }}>
                  Now Streaming
                </p>
                <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '30px', fontWeight: 400, lineHeight: 1.1, color: '#fff', marginBottom: '10px' }}>
                  {getGreeting()}, {session?.name?.split(' ')[0] || 'Listener'}
                </h1>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, maxWidth: '480px' }}>
                  Stream full-length songs free — from <strong style={{ color: 'rgba(255,255,255,0.75)' }}>YouTube Music</strong>,{' '}
                  <strong style={{ color: 'rgba(255,255,255,0.75)' }}>Audius</strong> (indie &amp; electronic) and{' '}
                  <strong style={{ color: 'rgba(255,255,255,0.75)' }}>Internet Archive</strong> (public-domain tracks).
                </p>
              </div>

              {/* Recommendations */}
              <div className="liquid-glass" style={{ borderRadius: '20px', padding: '20px 24px' }}>
                <Recommendations
                  currentTrack={audio.currentTrack}
                  currentTrackId={audio.currentTrack?.id}
                  onPlay={playTrackWithStats}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* ─────────── TAB: SEARCH ─────────── */}
        {activeTab === 'search' && (
          <motion.div
            key="search"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}
          >
            {/* Hero search heading */}
            <div style={{ textAlign: 'center', paddingBottom: '4px' }}>
              <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: '8px' }}>
                Search Across All Platforms
              </p>
              <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '38px', fontWeight: 400, color: '#fff', lineHeight: 1.1, marginBottom: '20px' }}>
                Explore Sounds
              </h1>

              {/* Search bar */}
              <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', maxWidth: '680px', margin: '0 auto' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={16} color="rgba(255,255,255,0.35)" style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input
                    type="text"
                    placeholder={`Search full songs on Audius · Archive.org${spotify.isAuthenticated ? ' · Spotify' : ''}${apple.isAuthorized ? ' · Apple Music' : ''}…`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="glass-input"
                    style={{ width: '100%', paddingLeft: '48px', fontSize: '14px' }}
                  />
                </div>
                <button type="submit" className="btn-primary" style={{ flexShrink: 0, padding: '12px 28px' }}>
                  {isSearching ? 'Searching…' : 'Search'}
                </button>
              </form>
            </div>

            {/* Results */}
            <div className="liquid-glass" style={{ borderRadius: '20px', padding: '20px 24px', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {searchQuery
                  ? <><span style={{ color: 'rgba(255,255,255,0.7)' }}>"{searchQuery}"</span> <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— {searchResults.length} full songs found</span></>
                  : 'Recommended Songs'}
              </h3>
              <div style={{ overflowY: 'auto', flex: 1 }}>
                <TrackList
                  tracks={searchResults}
                  currentTrack={audio.currentTrack}
                  isPlaying={audio.isPlaying}
                  onTrackSelect={playTrackWithStats}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* ─────────── TAB: LIBRARY ─────────── */}
        {activeTab === 'library' && (
          <motion.div
            key="library"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}
          >
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: '8px' }}>
                Your Collection
              </p>
              <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '38px', fontWeight: 400, color: '#fff', lineHeight: 1.1 }}>
                My Library
              </h1>
            </div>

            <div className="liquid-glass" style={{ borderRadius: '20px', padding: '20px 24px', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {libraryTracks.length > 0 ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                      {libraryTracks.length} saved tracks
                    </span>
                    <button
                      onClick={() => { if (window.confirm('Clear library?')) setLibraryTracks([]); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '9999px', fontSize: '12px', fontWeight: 500, background: 'rgba(252,60,68,0.1)', border: '1px solid rgba(252,60,68,0.2)', color: '#fc3c44' }}
                    >
                      <Trash2 size={12} /> Clear
                    </button>
                  </div>
                  <div style={{ overflowY: 'auto', flex: 1 }}>
                    <TrackList
                      tracks={libraryTracks}
                      currentTrack={audio.currentTrack}
                      isPlaying={audio.isPlaying}
                      onTrackSelect={audio.playTrack}
                    />
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '14px', color: 'rgba(255,255,255,0.2)', padding: '60px 0' }}>
                  <Library size={44} strokeWidth={1} />
                  <div style={{ textAlign: 'center' }}>
                    <h4 style={{ fontSize: '18px', fontFamily: "'Instrument Serif', serif", color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>
                      Your Collection is Empty
                    </h4>
                    <p style={{ fontSize: '13px' }}>Search for songs and save them here.</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ─────────── TAB: YT MUSIC PLAYLISTS ─────────── */}
        {activeTab === 'playlists' && (
          <YTPlaylists onPlayTrack={playTrackWithStats} />
        )}

        {/* ─────────── TAB: ACCOUNT ─────────── */}
        {activeTab === 'account' && (
          <AccountTab
            session={session}
            onLogout={() => { clearSession(); setSession(null); }}
            libraryTracks={libraryTracks}
            currentTrack={audio.currentTrack}
          />
        )}

        {/* ─────────── TAB: SETTINGS / CONNECT ─────────── */}
        {activeTab === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{ width: '100%' }}
          >
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: '8px' }}>
                Premium Integrations
              </p>
              <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '38px', fontWeight: 400, color: '#fff', lineHeight: 1.1 }}>
                Connect Services
              </h1>
            </div>
            <OAuthConnect spotify={spotify} apple={apple} />
          </motion.div>
        )}

        {/* ─────────── Queue Drawer ─────────── */}
        {isQueueOpen && (
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="liquid-glass"
            style={{
              width: '280px',
              borderRadius: '20px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              flexShrink: 0,
              alignSelf: 'flex-start',
              maxHeight: '100%',
            }}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ListMusic size={16} /> Queue
              </span>
              <button onClick={() => setIsQueueOpen(false)} style={{ color: 'rgba(255,255,255,0.4)', display: 'flex' }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
              {audio.trackQueue.length > 0 ? audio.trackQueue.map((track, idx) => (
                <div
                  key={`${track.id}-q-${idx}`}
                  onClick={() => playQueueTrack(track)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '8px 10px', borderRadius: '10px', cursor: 'pointer',
                    background: audio.currentTrack?.id === track.id ? 'rgba(var(--theme-glow-rgb), 0.1)' : 'transparent',
                    border: `1px solid ${audio.currentTrack?.id === track.id ? 'rgba(var(--theme-glow-rgb), 0.15)' : 'transparent'}`,
                    marginBottom: '2px',
                  }}
                >
                  <img src={track.cover} alt="" style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: audio.currentTrack?.id === track.id ? 'rgb(var(--theme-glow-rgb))' : '#fff' }}>
                      {track.title}
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {track.artist}
                    </div>
                  </div>
                </div>
              )) : (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '13px', padding: '40px 0' }}>
                  Queue is empty
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </main>

      {/* ── Global Bottom Player Bar ── */}
      <Player
        audio={audio}
        ytPlayer={ytPlayer}
        isYouTubeTrack={isYouTubeTrack}
        onOpenQueue={() => setIsQueueOpen(!isQueueOpen)}
      />
    </div>
      )}
    </AnimatePresence>
  );
}
