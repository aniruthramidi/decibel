import { useEffect, useState } from 'react';

export default function useColorExtractor(imageUrl) {
  const [colors, setColors] = useState({
    dominant: 'rgba(99, 102, 241, 0.15)', // Indigo fallback
    glow: 'rgba(99, 102, 241, 0.4)',
    rgb: '99, 102, 241'
  });

  useEffect(() => {
    if (!imageUrl) return;

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageUrl;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 10;
        canvas.height = 10;

        ctx.drawImage(img, 0, 0, 10, 10);
        const imageData = ctx.getImageData(0, 0, 10, 10).data;

        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < imageData.length; i += 4) {
          // Skip extremely bright or dark pixels to get rich, saturated hues
          const red = imageData[i];
          const green = imageData[i + 1];
          const blue = imageData[i + 2];
          const brightness = (red * 299 + green * 587 + blue * 114) / 1000;

          if (brightness > 20 && brightness < 230) {
            r += red;
            g += green;
            b += blue;
            count++;
          }
        }

        // Fallback if no colorful pixels found
        if (count === 0) {
          for (let i = 0; i < imageData.length; i += 4) {
            r += imageData[i];
            g += imageData[i + 1];
            b += imageData[i + 2];
            count++;
          }
        }

        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);

        // Ensure the colors are rich enough (boosting saturation if needed)
        // Adjust values for aesthetic glows
        const dominantColor = `rgba(${r}, ${g}, ${b}, 0.12)`;
        const glowColor = `rgba(${r}, ${g}, ${b}, 0.45)`;
        const rgbString = `${r}, ${g}, ${b}`;

        const extracted = {
          dominant: dominantColor,
          glow: glowColor,
          rgb: rgbString
        };

        setColors(extracted);

        // Set CSS variables globally
        document.documentElement.style.setProperty('--theme-glow-rgb', rgbString);
        document.documentElement.style.setProperty('--theme-glow', glowColor);
        document.documentElement.style.setProperty('--theme-dominant', dominantColor);
      } catch (err) {
        console.warn('Canvas image analysis error (probably CORS restriction on source):', err);
      }
    };

    img.onerror = () => {
      console.warn('Could not load image to extract color');
    };
  }, [imageUrl]);

  return colors;
}
