import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')

source = source.replace(
  "  const setFeaturedShow = (showId: string) => {\n    const show = cms.shows.find((item) => item.id === showId)\n    onUpdateCms({",
  "  const setFeaturedShow = (showId: string) => {\n    onUpdateCms({",
)

fs.writeFileSync(path, source)
console.log('Applied EBG+ Phase 1.8 build cleanup.')
