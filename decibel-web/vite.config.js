import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Python ytmusicapi backend
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // Deezer public API proxy (no auth key required)
      '/deezer-api': {
        target: 'https://api.deezer.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/deezer-api/, ''),
      },
      // MusicBrainz API proxy
      '/musicbrainz-api': {
        target: 'https://musicbrainz.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/musicbrainz-api/, ''),
      },
      // Audius API proxy fallback
      '/audius-api': {
        target: 'https://discoveryprovider.audius.co',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/audius-api/, ''),
      },
    },
  },
})
