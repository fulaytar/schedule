import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' — сайт працює з будь-якої адреси GitHub Pages (user.github.io/назва-репо/)
export default defineConfig({
  plugins: [react()],
  base: './',
});
