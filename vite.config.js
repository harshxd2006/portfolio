import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const cacheOneYear = 'public, max-age=31536000, immutable';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: ['three', '@react-three/fiber', '@react-three/drei'],
  },
  server: {
    headers: {
      'Cache-Control': cacheOneYear,
    },
  },
  preview: {
    headers: {
      'Cache-Control': cacheOneYear,
    },
  },
});
