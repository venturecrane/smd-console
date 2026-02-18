import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import sitemap from '@astrojs/sitemap'
import AstroPWA from '@vite-pwa/astro'

export default defineConfig({
  site: 'https://smdurgan.com',
  output: 'static',
  build: {
    inlineStylesheets: 'always',
  },
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    sitemap(),
    AstroPWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'SMDurgan',
        short_name: 'SMD',
        description:
          'SMDurgan - venture studio building focused software products.',
        start_url: '/',
        display: 'standalone',
        background_color: '#1a1a2e',
        theme_color: '#1a1a2e',
        icons: [
          {
            src: '/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        navigateFallback: undefined,
        globPatterns: ['**/*.{css,js,html,svg,png,ico,txt,woff,woff2}'],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
})
