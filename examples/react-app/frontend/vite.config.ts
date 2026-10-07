import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // @ray-ds/* are file: links to ray-ds/packages: resolve their imports (react)
  // from this app, and see regenerated packages without reinstalling.
  resolve: { preserveSymlinks: true },
  // Relative URLs: the build is served from ray://app/ by the raylang program.
  base: './',
})
