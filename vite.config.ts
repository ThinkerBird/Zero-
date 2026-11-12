import fs from 'node:fs';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJson = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8')
);

function githubPagesSpaPlugin(): Plugin {
  return {
    name: 'github-pages-spa-fallback',
    closeBundle() {
      const distIndex = path.resolve(__dirname, 'dist/index.html');
      const dist404 = path.resolve(__dirname, 'dist/404.html');
      if (fs.existsSync(distIndex)) {
        fs.copyFileSync(distIndex, dist404);
      }
    },
  };
}

export default defineConfig(() => {
  const repoName = process.env.GITHUB_REPOSITORY ? process.env.GITHUB_REPOSITORY.split('/')[1] : '';
  const isUserPage = repoName.endsWith('.github.io');
  const base = process.env.VITE_BASE || (repoName && !isUserPage ? `/${repoName}/` : '/');
  const gitSha = process.env.GITHUB_SHA ? process.env.GITHUB_SHA.substring(0, 7) : (process.env.NODE_ENV === 'production' ? 'prod' : 'dev');
  const appVersion = `v${packageJson.version} (${gitSha})`;

  return {
    base,
    define: {
      __APP_VERSION__: JSON.stringify(appVersion),
    },
    plugins: [
      react(),
      tailwindcss(),
      githubPagesSpaPlugin(),
      VitePWA({
        registerType: 'prompt',
        includeAssets: [
          'favicon.svg',
          'apple-touch-icon.png',
          'icons/icon-192.png',
          'icons/icon-512.png',
          'icons/icon-maskable-512.png',
          'icons/favicon.svg',
          'icons/apple-touch-icon.png',
          'icons/favicon-96x96.png',
        ],
        manifest: {
          id: base,
          name: 'Zero — Zero-Knowledge Encryption Engine',
          short_name: 'Zero',
          description: 'Client-side zero-knowledge AES-256-GCM encryption and decryption for files and text.',
          theme_color: '#0a0a0c',
          background_color: '#0a0a0c',
          display: 'standalone',
          start_url: base,
          scope: base,
          icons: [
            {
              src: 'icons/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'icons/icon-maskable-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,woff,woff2,svg,png}'],
          navigateFallback: base === '/' ? 'index.html' : `${base}index.html`,
          cleanupOutdatedCaches: true,
          importScripts: ['sw-notifications.js'],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
      dedupe: ['react', 'react-dom'],
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
