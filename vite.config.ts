import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import {defineConfig} from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(() => {
  return {
    plugins: [
      // The hosted preview serves through Express without a Vite HMR websocket.
      // Disable the React refresh preamble so it does not import createHotContext
      // from the preview's incompatible /@vite/client shim.
      react({ fastRefresh: false }),
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
