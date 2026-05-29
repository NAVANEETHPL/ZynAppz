import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    proxy: {
      '/api/openai': {
        target: 'https://api.openai.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/openai/, '')
      },
      '/api/anthropic': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/anthropic/, '')
      },
      '/api/removebg': {
        target: 'https://api.remove.bg',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/removebg/, '')
      }
    }
  }
});
