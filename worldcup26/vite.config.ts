import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    host: true, // bind 0.0.0.0 so port-forwarding / 127.0.0.1 works (not just ::1)
    port: 5173,
  },
  build: {
    chunkSizeWarningLimit: 1500,
    target: 'es2022',
  },
});
