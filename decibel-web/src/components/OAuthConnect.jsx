import React, { useState } from 'react';
import { ShieldCheck, Info, Key, LogIn, LogOut, CheckCircle2 } from 'lucide-react';

export default function OAuthConnect({ spotify, apple }) {
  const [spotifyIdInput, setSpotifyIdInput] = useState(spotify.clientId);
  const [appleTokenInput, setAppleTokenInput] = useState(apple.developerToken);

  const handleSpotifySave = (e) => {
    e.preventDefault();
    spotify.saveClientId(spotifyIdInput.trim());
    alert('Spotify Client ID saved locally!');
  };

  const handleAppleSave = (e) => {
    e.preventDefault();
    apple.saveDeveloperToken(appleTokenInput.trim());
    alert('Apple Developer Token saved locally!');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '32px',
      maxWidth: '800px',
      margin: '0 auto',
      padding: '12px'
    }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>Integrations & OAuth Connections</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Connect your premium Spotify and Apple Music subscriptions. OAuth processes are handled client-side inside your browser securely.
        </p>
      </div>

      {/* Spotify Card */}
      <div className="glass" style={{
        padding: '24px',
        borderRadius: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        border: '1px solid rgba(29, 185, 84, 0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'rgba(29, 185, 84, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg viewBox="0 0 24 24" width="28" height="28" fill="#1db954">
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.565.387-.86.207-2.377-1.454-5.37-1.783-8.894-.982-.336.075-.668-.135-.745-.47-.077-.337.135-.67.47-.747 3.856-.882 7.15-.5 9.822 1.135.295.18.387.563.207.857zm1.225-2.72c-.226.367-.707.487-1.074.26-2.72-1.672-6.87-2.157-10.076-1.182-.413.125-.848-.107-.973-.52-.125-.413.107-.847.52-.973 3.666-1.114 8.232-.573 11.343 1.344.367.226.488.708.26 1.07zm.105-2.828C14.502 8.8 8.784 8.61 5.46 9.62c-.514.156-1.05-.133-1.206-.647-.156-.514.133-1.05.647-1.206 3.82-1.16 10.14-.94 14.07 1.393.462.275.614.872.34 1.334-.275.463-.87.615-1.332.34z" />
              </svg>
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Spotify Integration</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Stream playlists and search tracks via Spotify Web API</p>
            </div>
          </div>

          {spotify.isAuthenticated ? (
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 700,
              padding: '6px 12px',
              borderRadius: '50px',
              backgroundColor: 'rgba(29, 185, 84, 0.1)',
              color: '#1db954',
              border: '1px solid rgba(29, 185, 84, 0.2)'
            }}>
              <CheckCircle2 size={14} /> ACTIVE
            </span>
          ) : (
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>NOT CONNECTED</span>
          )}
        </div>

        {spotify.isAuthenticated && spotify.userProfile ? (
          /* Profile Details */
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '16px',
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-light)'
          }}>
            {spotify.userProfile.images?.[0]?.url ? (
              <img
                src={spotify.userProfile.images[0].url}
                alt="Profile"
                style={{ width: '48px', height: '48px', borderRadius: '50%' }}
              />
            ) : (
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ShieldCheck size={20} />
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 600, fontSize: '15px' }}>{spotify.userProfile.display_name}</span>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{spotify.userProfile.email}</span>
            </div>
            <button
              onClick={spotify.logout}
              className="glass"
              style={{
                marginLeft: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '50px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#fc3c44'
              }}
            >
              <LogOut size={14} /> Disconnect
            </button>
          </div>
        ) : (
          /* Credentials Form */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <form onSubmit={handleSpotifySave} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Spotify Client ID</label>
                <input
                  type="text"
                  placeholder="Enter Client ID from Spotify Dev Dashboard"
                  value={spotifyIdInput}
                  onChange={(e) => setSpotifyIdInput(e.target.value)}
                  className="glass-input"
                  style={{ width: '100%', fontSize: '14px' }}
                />
              </div>
              <button
                type="submit"
                className="btn-primary"
                style={{ alignSelf: 'flex-end', padding: '12px 20px', borderRadius: '50px', fontSize: '14px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', boxShadow: 'none' }}
              >
                Save
              </button>
            </form>

            <button
              onClick={spotify.login}
              className="btn-primary"
              disabled={!spotify.clientId}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '12px',
                borderRadius: '50px',
                fontSize: '15px',
                backgroundColor: spotify.clientId ? '#1db954' : 'rgba(255,255,255,0.05)',
                color: spotify.clientId ? 'white' : 'var(--text-muted)',
                boxShadow: spotify.clientId ? '0 4px 15px rgba(29, 185, 84, 0.3)' : 'none',
                cursor: spotify.clientId ? 'pointer' : 'not-allowed'
              }}
            >
              <LogIn size={16} /> Connect to Spotify Web
            </button>
          </div>
        )}
      </div>

      {/* Apple Music Card */}
      <div className="glass" style={{
        padding: '24px',
        borderRadius: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        border: '1px solid rgba(252, 60, 68, 0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifycontent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'rgba(252, 60, 68, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg viewBox="0 0 24 24" width="28" height="28" fill="#fc3c44">
                <path d="M19.006 3.504a.75.75 0 0 0-.756.732v12.247c0 1.636-1.503 2.917-3.25 2.917-1.747 0-3.25-1.28-3.25-2.917 0-1.637 1.503-2.917 3.25-2.917.433 0 .848.08 1.25.228V7.329l-6 1.3v8.854c0 1.636-1.503 2.917-3.25 2.917-1.747 0-3.25-1.28-3.25-2.917 0-1.637 1.503-2.917 3.25-2.917.433 0 .848.08 1.25.228V5.394a.75.75 0 0 1 .593-.734l7-1.517a.75.75 0 0 1 .913.73v.01l.006-.379z" />
              </svg>
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Apple Music Integration</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Stream full tracks and query details via MusicKit JS</p>
            </div>
          </div>

          {apple.isAuthorized ? (
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 700,
              padding: '6px 12px',
              borderRadius: '50px',
              backgroundColor: 'rgba(252, 60, 68, 0.1)',
              color: '#fc3c44',
              border: '1px solid rgba(252, 60, 68, 0.2)'
            }}>
              <CheckCircle2 size={14} /> ACTIVE
            </span>
          ) : (
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>NOT CONNECTED</span>
          )}
        </div>

        {apple.isAuthorized ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '16px',
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-light)'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'rgba(252, 60, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldCheck size={20} color="#fc3c44" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 600, fontSize: '15px' }}>Apple Music Subscriber Account</span>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>MusicKit SDK fully authorized</span>
            </div>
            <button
              onClick={apple.logout}
              className="glass"
              style={{
                marginLeft: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '50px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#fc3c44'
              }}
            >
              <LogOut size={14} /> Disconnect
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <form onSubmit={handleAppleSave} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Developer Token (JWT)</label>
                <input
                  type="password"
                  placeholder="Enter MusicKit Developer Token"
                  value={appleTokenInput}
                  onChange={(e) => setAppleTokenInput(e.target.value)}
                  className="glass-input"
                  style={{ width: '100%', fontSize: '14px' }}
                />
              </div>
              <button
                type="submit"
                className="btn-primary"
                style={{ alignSelf: 'flex-end', padding: '12px 20px', borderRadius: '50px', fontSize: '14px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', boxShadow: 'none' }}
              >
                Save
              </button>
            </form>

            <button
              onClick={apple.login}
              className="btn-primary"
              disabled={!apple.developerToken}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '12px',
                borderRadius: '50px',
                fontSize: '15px',
                backgroundColor: apple.developerToken ? '#fc3c44' : 'rgba(255,255,255,0.05)',
                color: apple.developerToken ? 'white' : 'var(--text-muted)',
                boxShadow: apple.developerToken ? '0 4px 15px rgba(252, 60, 68, 0.3)' : 'none',
                cursor: apple.developerToken ? 'pointer' : 'not-allowed'
              }}
            >
              <LogIn size={16} /> Authorize Apple Music Account
            </button>
          </div>
        )}
      </div>

      {/* Guide details */}
      <div style={{
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: '16px',
        padding: '20px',
        border: '1px solid var(--border-light)'
      }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '12px' }}>
          <Info size={20} style={{ color: 'var(--text-secondary)', marginTop: '2px' }} />
          <div>
            <h4 style={{ fontWeight: 600, fontSize: '16px', color: 'white' }}>Developer Guide</h4>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Setting up developer profiles enables direct full track search and streaming:
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-muted)', paddingLeft: '32px' }}>
          <p>
            <strong>Spotify redirect URL:</strong> Set your Spotify App Redirect URI to <code>{window.location.origin}</code> inside the Spotify Developer Dashboard.
          </p>
          <p>
            <strong>Apple Music tokens:</strong> Developer tokens are signed JWT keys generated using an Apple Developer account with an Apple Music Identifier and private key (.p8 file).
          </p>
        </div>
      </div>
    </div>
  );
}
