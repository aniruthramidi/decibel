import React, { useRef, useEffect } from 'react';

export default function Equalizer({ analyser, isPlaying }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Adapt sizing
    const resizeCanvas = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight || 120;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Analyzer Data Buffer
    const bufferLength = analyser ? analyser.frequencyBinCount : 128;
    const dataArray = new Uint8Array(bufferLength);

    const renderFrame = () => {
      animationFrameId = requestAnimationFrame(renderFrame);

      const width = canvas.width;
      const height = canvas.height;

      // Draw background
      ctx.clearRect(0, 0, width, height);

      // Get color tokens from css root
      const themeColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--theme-glow-rgb') || '99, 102, 241';

      if (analyser && isPlaying) {
        analyser.getByteFrequencyData(dataArray);

        const barWidth = (width / bufferLength) * 1.6;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          // Normalize volume value
          const val = dataArray[i] / 255.0;
          barHeight = val * height * 0.85;

          if (barHeight < 3) barHeight = 3; // Minimum height for style

          // Create a gradient matching the theme
          const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height);
          gradient.addColorStop(0, `rgba(${themeColor}, 0.9)`);
          gradient.addColorStop(0.5, `rgba(${themeColor}, 0.55)`);
          gradient.addColorStop(1, `rgba(${themeColor}, 0.1)`);

          ctx.fillStyle = gradient;
          
          // Draw rounded bars
          ctx.beginPath();
          ctx.roundRect(x, height - barHeight, barWidth - 2, barHeight, [4, 4, 0, 0]);
          ctx.fill();

          x += barWidth;
          if (x >= width) break;
        }
      } else {
        // Draw a gentle glowing wave when paused
        const barWidth = 6;
        const spacing = 4;
        const count = Math.ceil(width / (barWidth + spacing));
        let x = 0;

        for (let i = 0; i < count; i++) {
          // Generate a smooth sine wave
          const time = Date.now() * 0.003;
          const sine = Math.sin(i * 0.15 + time);
          const barHeight = 4 + (sine + 1) * 12; // Gentle hover amplitude

          const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height);
          gradient.addColorStop(0, `rgba(${themeColor}, 0.45)`);
          gradient.addColorStop(1, `rgba(${themeColor}, 0.05)`);

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(x, height - barHeight, barWidth, barHeight, [3, 3, 0, 0]);
          ctx.fill();

          x += barWidth + spacing;
        }
      }
    };

    renderFrame();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [analyser, isPlaying]);

  return (
    <div style={{ width: '100%', height: '100px', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
}
