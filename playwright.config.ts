import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  // Runs against the production build, which is what ships.
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
  },
  use: {
    baseURL: 'http://localhost:4173',
    // Installed Chrome (present on GitHub's runners) instead of a downloaded browser.
    channel: 'chrome',
    reducedMotion: 'reduce',
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'phone', use: { viewport: { width: 390, height: 844 } } },
  ],
})
