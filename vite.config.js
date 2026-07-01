import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Proxies /api and /ws to the Spring Boot backend during development
// so the frontend can be run on a different port without CORS pain.
export default defineConfig({
  plugins: [react()],
  // sockjs-client expects the Node "global" object to exist (a leftover from
  // its Webpack-era build). Vite doesn't polyfill Node globals by default,
  // so we map `global` to `globalThis` for both dev and the production build.
  define: {
    global: "globalThis",
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/ws': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
