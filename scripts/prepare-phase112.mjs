import fs from 'node:fs'

const path = new URL('./apply-phase112-studio-polls-forms.mjs', import.meta.url)
let source = fs.readFileSync(path, 'utf8')

source = source.replace("  const [state, setState('')]", "  const [state, setState] = useState('')")
source = source.replace(
  "must(\n  `<section className=\"heartspell-section heartspell-vote-teaser\">[\\\\s\\\\S]*?</section>`,\n  `<LivePollSection showId={show.id} />`,\n  'replace Heartspell voting teaser with live polls',\n)",
  "must(\n  /<section className=\"heartspell-section heartspell-vote-teaser\">[\\s\\S]*?<\\/section>/,\n  `<LivePollSection showId={show.id} />`,\n  'replace Heartspell voting teaser with live polls',\n)",
)

fs.writeFileSync(path, source)
console.log('Prepared Phase 1.12 integration script.')
