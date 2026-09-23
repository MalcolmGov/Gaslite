import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base so the built app can be opened from any static host or sub-path.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 5173, host: true },
  // One ~260 KB (gzipped) bundle is fine for an offline training app.
  build: { chunkSizeWarningLimit: 1200 },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
} as any);
