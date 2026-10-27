import { fileURLToPath, URL } from 'node:url';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const frontendRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: resolve(frontendRoot, 'apps/storefront'),
  envDir: frontendRoot,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(frontendRoot, 'src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    fs: {
      allow: [frontendRoot],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true,
  },
  build: {
    outDir: resolve(frontendRoot, 'dist/storefront'),
    emptyOutDir: true,
  },
  define: {
    'import.meta.env.VITE_APP_SCOPE': JSON.stringify('storefront'),
  },
});
