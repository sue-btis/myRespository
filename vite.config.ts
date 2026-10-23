import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// The hero text is the LCP; the hashed font URL only exists at build time, so the preload is added then.
function preloadHeroFont(): Plugin {
  return {
    name: 'preload-hero-font',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        const font = Object.keys(ctx.bundle ?? {}).find((f) => /archivo-latin-wdth-normal-.+\.woff2$/.test(f))
        if (!font) return []
        return [{ tag: 'link', attrs: { rel: 'preload', as: 'font', type: 'font/woff2', crossorigin: '', href: `/${font}` }, injectTo: 'head-prepend' }]
      },
    },
  }
}

export default defineConfig({
  plugins: [react(), preloadHeroFont()],
})
