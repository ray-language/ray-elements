import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue({
      // Raw <ray-*> tags in templates are custom elements, not Vue components.
      template: { compilerOptions: { isCustomElement: (tag) => tag.startsWith('ray-') } },
    }),
  ],
  // @ray-ds/* are file: links to ray-ds/packages: resolve their imports (vue)
  // from this app, and see regenerated packages without reinstalling.
  resolve: { preserveSymlinks: true },
  // Relative URLs: the build is served from ray://app/ by the raylang program.
  base: './',
})
