import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// In dev, serve at /. For production builds (GitHub Pages),
// serve under /Locals-Basketball-League/. Override either with VITE_BASE.
export default defineConfig(({ command }) => {
  const base =
    process.env.VITE_BASE ??
    (command === 'build' ? '/Locals-Basketball-League/' : '/');

  return {
    base,
    plugins: [react()],
    publicDir: 'assets',
    resolve: {
      alias: {
        '@data': fileURLToPath(new URL('./data', import.meta.url)),
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  };
});
