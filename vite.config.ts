import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { fileURLToPath } from 'url';
import {defineConfig} from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(() => {
  return {
    plugins: [
      // The hosted preview serves through Express without a Vite HMR websocket.
      // Vite's native JSX transform is sufficient here; the React plugin's
      // refresh preamble imports createHotContext from /@vite/client.
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
