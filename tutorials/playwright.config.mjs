/* Copyright 2026 Tutorializer LLC */

import path from 'node:path'

import { defineConfig } from '@playwright/test'

const exampleDirectory = path.resolve(import.meta.dirname, '..')

export default defineConfig({
  testDir: import.meta.dirname,
  testMatch: '*.spec.mjs',
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: 'line',
  outputDir: path.join(import.meta.dirname, 'test-results'),
  use: {
    baseURL: 'http://127.0.0.1:3100',
    launchOptions: {
      args: ['--autoplay-policy=no-user-gesture-required'],
    },
    trace: 'retain-on-failure',
    viewport: { width: 1280, height: 808 },
  },
  webServer: {
    command: 'npm run build && npm run start -- --host 127.0.0.1 --port 3100',
    cwd: exampleDirectory,
    reuseExistingServer: false,
    timeout: 120_000,
    url: 'http://127.0.0.1:3100/favicon.ico',
  },
})
