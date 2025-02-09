import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 24009,
    allowedHosts: ['tubik-corp.ru', 'fridge.tubik-corp.ru'],
    proxy: {
      '/api': {
        target: 'http://tubik-corp.ru:24030',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});