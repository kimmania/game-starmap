import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const buildHash = process.env.GITHUB_SHA?.slice(0, 7) || Date.now().toString(36);

export default defineConfig({
  base: '/game-starmap/',
  define: {
    __BUILD_HASH__: JSON.stringify(buildHash),
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        name: 'Star Map',
        short_name: 'Star Map',
        description: 'A spatial logic puzzle: place two stars per row, column, and region without touching.',
        theme_color: '#0f0f1a',
        background_color: '#0f0f1a',
        display: 'standalone',
        orientation: 'any',
        start_url: '/game-starmap/',
        scope: '/game-starmap/',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        globIgnores: ['**/puzzles/**'],
        navigateFallback: '/game-starmap/index.html',
        runtimeCaching: [
          {
            urlPattern: ({ url }: { url: URL }) =>
              url.pathname.includes('/puzzles/') && url.pathname.endsWith('.json'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'puzzle-banks',
              expiration: {
                maxEntries: 8,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
        ],
      },
    }),
  ],
});
