import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const packageJson = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'))

const changelog = readFileSync(new URL('./CHANGELOG.md', import.meta.url), 'utf-8')
const releaseLine = changelog
  .split('\n')
  .find((line) => line.startsWith(`## [${packageJson.version}]`))
const releaseDateMatch = releaseLine?.match(/\((\d{4}-\d{2}-\d{2})\)/)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __APP_RELEASE_DATE__: JSON.stringify(releaseDateMatch?.[1] ?? ''),
  },
})
