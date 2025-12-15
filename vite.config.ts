import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.BASE_URL || '/',
  build: {
    outDir: 'dist',
  },
  server: {
    host: true, // Allow access from network
  },
})

