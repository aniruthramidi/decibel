import React from 'react';

export default function VinylPlayer({ currentTrack, isPlaying }) {
  const coverUrl = currentTrack?.cover || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&auto=format&fit=crop&q=80';
  const title = currentTrack?.title || 'No track playing';
  const artist = currentTrack?.artist || 'Select a track to start';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px 40px',
      gap: '24px',
      width: '100%',
      position: 'relative'
    }}>
      {/* Container for Sleeve & Vinyl Disc */}
      <div style={{
        position: 'relative',
        width: '300px',
        height: '300px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: isPlaying ? '60px' : '0px',
        transition: 'margin-right 0.8s cubic-bezier(0.25, 0.8, 0.25, 1)'
      }}>
        {/* Vinyl Record */}
        <div 
          className={`vinyl-record ${isPlaying ? 'spinning' : ''}`}
          style={{
            position: 'absolute',
            width: '270px',
            height: '270px',
            borderRadius: '50%',
            background: `radial-gradient(circle, transparent 28%, #0f0f11 29%, #1b1b1e 30%, #0d0d0f 38%, #141417 40%, #080809 46%, #1c1c1f 48%, #0a0a0b 60%, #151518 62%, #080809 70%, #1a1a1c 72%, #0b0b0c 82%, #17171a 84%, #000000 95%)`,
            border: '2px solid rgba(255, 255, 255, 0.05)',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.6), inset 0 0 10px rgba(255,255,255,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
            transform: isPlaying ? 'translateX(55%)' : 'translateX(0%)',
            transition: 'transform 0.8s cubic-bezier(0.25, 0.8, 0.25, 1)',
          }}
        >
          {/* Center Label (Inner Cover Image) */}
          <div style={{
            position: 'relative',
            width: '90px',
            height: '90px',
            borderRadius: '50%',
            overflow: 'hidden',
            border: '4px solid #141416',
            boxShadow: 'inset 0 0 6px rgba(0,0,0,0.8)'
          }}>
            <img 
              src={coverUrl} 
              alt="Center label" 
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
            {/* Vinyl Spindle Center Hole */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: '#050608',
              border: '2px solid #ccc',
              boxShadow: '0 0 2px rgba(0,0,0,0.8)'
            }} />
          </div>
        </div>

        {/* Outer Album Sleeve */}
        <div style={{
          position: 'absolute',
          width: '280px',
          height: '280px',
          borderRadius: '16px',
          overflow: 'hidden',
          zIndex: 2,
          boxShadow: '0 15px 45px rgba(0, 0, 0, 0.65)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          left: 0,
          top: 10
        }}>
          {/* Main Album Art */}
          <img 
            src={coverUrl} 
            alt={title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'brightness(0.9)'
            }}
          />
          {/* Sleeve Opening Shadow Gradient on the right side to look like a real opening */}
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '20px',
            height: '100%',
            background: 'linear-gradient(to right, transparent, rgba(0, 0, 0, 0.75))',
            pointerEvents: 'none'
          }} />
          {/* Sleeve Gloss Overlay */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 50%, rgba(0,0,0,0.1) 100%)',
            pointerEvents: 'none'
          }} />
        </div>

        {/* Tonearm / Needle (Pivots when playing) */}
        <div style={{
          position: 'absolute',
          top: '-15px',
          right: isPlaying ? '-20px' : '-50px',
          width: '90px',
          height: '180px',
          zIndex: 3,
          transformOrigin: '45px 20px',
          transform: isPlaying ? 'rotate(18deg)' : 'rotate(-25deg)',
          transition: 'all 0.8s cubic-bezier(0.25, 0.8, 0.25, 1)',
          pointerEvents: 'none'
        }}>
          {/* Tonearm Base */}
          <div style={{
            position: 'absolute',
            top: '5px',
            left: '30px',
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #718096 30%, #2d3748 70%)',
            border: '2.5px solid #1a202c',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.4)'
          }} />
          {/* Tonearm Arm */}
          <div style={{
            position: 'absolute',
            top: '25px',
            left: '42px',
            width: '6px',
            height: '120px',
            backgroundColor: '#cbd5e0',
            borderRadius: '3px',
            boxShadow: '1px 1px 3px rgba(0,0,0,0.3)',
            transform: 'rotate(5deg)',
            transformOrigin: 'top center'
          }} />
          {/* Tonearm Head / Cartridge */}
          <div style={{
            position: 'absolute',
            top: '138px',
            left: '46px',
            width: '12px',
            height: '24px',
            backgroundColor: '#1a202c',
            border: '1px solid #718096',
            borderRadius: '2px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
            transform: 'rotate(-10deg)'
          }} />
        </div>
      </div>

      {/* Album & Track Details under the player */}
      <div style={{
        textAlign: 'center',
        marginTop: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        maxWidth: '300px'
      }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>{title}</h2>
        <p style={{
          fontSize: '15px',
          fontWeight: 500,
          color: 'var(--text-secondary)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>{artist}</p>
      </div>
    </div>
  );
}
