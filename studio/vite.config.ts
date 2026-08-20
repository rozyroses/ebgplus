import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const studioRoot = fileURLToPath(new URL('.', import.meta.url))
const repoRoot = fileURLToPath(new URL('..', import.meta.url))

export default defineConfig({
  root: studioRoot,
  envDir: repoRoot,
  base: '/',
  plugins: [react()],
  server: {
    fs: {
      allow: [repoRoot],
    },
  },
  build: {
    outDir: fileURLToPath(new URL('../dist-studio', import.meta.url)),
    emptyOutDir: true,
  },
})
