import { copyFile } from 'node:fs/promises'

// GitHub Pages serves this document for direct links to React routes.
await copyFile(new URL('../dist/index.html', import.meta.url), new URL('../dist/404.html', import.meta.url))
