import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: 'admin-dist',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'admin.html')
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env.VITE_ADMIN_MODE': JSON.stringify('true'),
    'process.env.VITE_API_URL': JSON.stringify('http://localhost:5000/api'),
  }
})
