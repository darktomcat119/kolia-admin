import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const vercelOrigin = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '';

export default defineConfig({
  base: process.env.VITE_BASE || '/',
  define: {
    'import.meta.env.VITE_VERCEL_ORIGIN': JSON.stringify(vercelOrigin),
  },
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
});
