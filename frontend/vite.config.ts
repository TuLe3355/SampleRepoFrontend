import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const serverUrl = env.VITE_SERVER_URL || 'http://localhost:8000'

  return {
    plugins: [react()],
    server: {
      port: 5173,
      // Backend chưa bật CORS nên khi dev, mọi request /api được proxy sang server
      proxy: {
        '/api': { target: serverUrl, changeOrigin: true },
      },
    },
  }
})
