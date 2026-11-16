import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: true,
    allowedHosts: [
      'all',
      '.ngrok-free.dev',
      '.ngrok-free.app',
      'encounter-sasquatch-contort.ngrok-free.dev',
    ],
  },
})
