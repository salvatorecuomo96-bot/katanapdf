import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Target older Safari/iOS versions so the site works on iPhones running iOS 13–15
  build: {
    target: ['es2017', 'safari13'],
  },
  esbuild: {
    target: 'es2017',
  },
})
