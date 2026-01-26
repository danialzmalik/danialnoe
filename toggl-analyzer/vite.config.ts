import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/toggl-analyzer/',
  build: {
    outDir: '../site/public/toggl-analyzer',
    emptyOutDir: true,
  },
})
