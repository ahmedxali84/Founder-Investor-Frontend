import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.js'],
    globals: true,
    // This project's jsdom environment setup is slow on this machine (OneDrive-
    // synced disk), which pushed a couple of otherwise-passing async tests past
    // the default 5000ms per-test timeout.
    testTimeout: 20000,
  },
})
