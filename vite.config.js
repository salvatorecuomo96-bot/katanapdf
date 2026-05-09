import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Target modern environments to support import.meta, while maintaining compatibility via build target if needed
  build: {
    target: 'es2020',
  },
  esbuild: {
    target: 'es2020',
  },
})
