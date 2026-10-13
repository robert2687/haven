import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { fileURLToPath } from 'url';
import {defineConfig} from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(() => {
  return {
    plugins: [
      // JSX is handled by Vite's esbuild transform. Omitting the React plugin
      // keeps the hosted Express preview from injecting Fast Refresh imports.

      tailwindcss(),
      {
        name: 'disable-preview-hmr-client',
        transformIndexHtml: {
          order: 'post',
          handler(html) {
            return html
              .replace(/<script[^>]*src=["'][^"']*\/@vite\/(?:client|env)[^"']*["'][^>]*><\/script>/gi, '')
              .replace(/(?:import|export)\s+[^;]*["']\/@vite\/(?:client|env)[^"']*["'];?/gi, '')
              .replace(/["']\/@vite\/(?:client|env)[^"']*["']/gi, '');
          },
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // The app is served through Express middleware in the hosted preview,
      // so Vite cannot own the WebSocket upgrade for HMR.
      hmr: false,
      // Keep the preview stable while files are synchronized by the host.
      watch: null,
    },
  };
});
