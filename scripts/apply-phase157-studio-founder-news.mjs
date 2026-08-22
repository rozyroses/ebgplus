import fs from 'node:fs'

const appPath = new URL('../studio/src/App.tsx', import.meta.url)
const mainPath = new URL('../studio/src/main.tsx', import.meta.url)

let source = fs.readFileSync(appPath, 'utf8')
let main = fs.readFileSync(mainPath, 'utf8')

if (!main.includes("./studioFounderNews.css")) {
  main = main.replace("import './studioMusicLyricsV2.css'", "import './studioMusicLyricsV2.css'\nimport './studioFounderNews.css'")
  fs.writeFileSync(mainPath, main)
}

if (source.includes('// EBG_STUDIO_PHASE157_FOUNDER_NEWS')) process.exit(0)

const must = (pattern, replacement, label) => {
  const next = source.replace(pattern, replacement)
  if (next === source) throw new Error(`Studio Phase 1.57 patch failed: ${label}`)
  source = next
}

must(
  "type StaffRole = 'editor' | 'producer' | 'administrator' | 'founder'",
  `// EBG_STUDIO_PHASE157_FOUNDER_NEWS\ntype StaffRole = 'editor' | 'producer' | 'administrator' | 'founder'\ntype NewsStatus = 'draft' | 'scheduled' | 'published'\ntype NewsPost = {\n  id: string\n  headline: string\n  summary: string\n  body: string\n  category: string\n  author: string\n  image?: string\n  featured?: boolean\n  status: NewsStatus\n  publishedAt: string\n}`,
  'news types',
)

must(
  "type StudioTab = 'overview' | 'series' | 'episodes' | 'talent' | 'casting' | 'polls' | 'media' | 'notifications' | 'team'",
  "type StudioTab = 'overview' | 'series' | 'episodes' | 'talent' | 'casting' | 'polls' | 'media' | 'news' | 'notifications' | 'team'",
  'studio tab type',
)

must(
  "  { id: 'media', label: 'Media', icon: '▧' },\n  { id: 'notifications', label: 'Notifications', icon: '◌' },",
  "  { id: 'media', label: 'Media', icon: '▧' },\n  { id: 'news', label: 'News', icon: 'N' },\n  { id: 'notifications', label: 'Notifications', icon: '◌' },",
  'news tab',
)

if (!source.includes('news?: NewsPost[]')) {
  must('  notifications?: NotificationItem[]', '  notifications?: NotificationItem[]\n  news?: NewsPost[]', 'cms news')
}

if (!source.includes('  news: [],')) {
  must('  notifications: [],', '  notifications: [],\n  news: [],', 'empty news')
}

must(
  "  const createNotification = async (event: FormEvent<HTMLFormElement>) => {\n    event.preventDefault()",
  "  const createNotification = async (event: FormEvent<HTMLFormElement>) => {\n    event.preventDefault()\n    if (authState.account.role !== 'founder') return setMessage('Founder access is required to publish notifications.')",
  'founder notification guard',
)

const newsActions = `  const createNewsPost = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (authState.account.role !== 'founder') return setMessage('Founder access is required to publish EBG News.')
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const status = String(form.get('status') ?? 'draft') as NewsStatus
    const publishAt = String(form.get('publishAt') ?? '')
    if (status === 'scheduled' && !publishAt) return setMessage('Choose a publish date before scheduling this story.')
    setBusy(true)
    try {
      const imageFile = form.get('image')
      const image = imageFile instanceof File && imageFile.size ? await uploadStudioMedia(imageFile, 'news') : ''
      const post: NewsPost = {
        id: 'news-' + Date.now(),
        headline: String(form.get('headline') ?? '').trim(),
        summary: String(form.get('summary') ?? '').trim(),
        body: String(form.get('body') ?? '').trim(),
        category: String(form.get('category') ?? 'EBG News').trim() || 'EBG News',
        author: String(form.get('author') ?? '').trim() || 'EBG',
        image: image || undefined,
        featured: form.get('featured') === 'on',
        status,
        publishedAt: status === 'published' ? nowIso() : publishAt ? new Date(publishAt).toISOString() : nowIso(),
      }
      await commitCms({ ...cms, news: [post, ...(cms.news ?? [])] }, status === 'published' ? 'News story published.' : 'News story saved.')
      formElement.reset()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'News story could not be saved.')
    } finally {
      setBusy(false)
    }
  }

  const updateNewsPost = (postId: string, patch: Partial<NewsPost>, success?: string) => {
    if (authState.account.role !== 'founder') return setMessage('Founder access is required to manage EBG News.')
    void commitCms({ ...cms, news: (cms.news ?? []).map((post) => post.id === postId ? { ...post, ...patch } : post) }, success)
  }

  const deleteNewsPost = (post: NewsPost) => {
    if (authState.account.role !== 'founder') return setMessage('Founder access is required to manage EBG News.')
    if (!window.confirm('Delete “' + post.headline + '”?')) return
    void commitCms({ ...cms, news: (cms.news ?? []).filter((item) => item.id !== post.id) }, 'News story deleted.')
  }

`

must('  const createNotification = async', newsActions + '  const createNotification = async', 'news actions')

must(
  '{TABS.map((item) => (',
  "{TABS.filter((item) => authState.account.role === 'founder' || !['news', 'notifications'].includes(item.id)).map((item) => (",
  'founder sidebar tabs',
)

must(
  "{TABS.filter((item) => item.id !== 'overview').map((item, index) =>",
  "{TABS.filter((item) => item.id !== 'overview' && (authState.account.role === 'founder' || !['news', 'notifications'].includes(item.id))).map((item, index) =>",
  'founder overview workspaces',
)

const newsWorkspace = `          {tab === 'news' && authState.account.role === 'founder' && (
            <>
              <section className="panel studio-news-hero"><PanelHeading eyebrow="FOUNDER NEWSROOM" title="EBG News" /><p>Publish official announcements, artist updates, premieres, casting news, platform updates, and stories from across the EBG universe. Published stories appear on the EBG+ News page and can surface on the homepage.</p></section>
              <section className="panel"><PanelHeading eyebrow="NEWS DESK" title="Stories" /><div className="studio-news-list">{(cms.news ?? []).length ? (cms.news ?? []).map((post) => <article key={post.id}><div className="studio-news-thumb">{post.image ? <img src={post.image} alt="" /> : <span>N</span>}</div><div><span className="eyebrow">{post.category} · {post.status}</span><h3>{post.headline}</h3><p>{post.summary}</p><small>{post.author} · {new Date(post.publishedAt).toLocaleString()}</small></div><div className="studio-news-actions"><select value={post.status} onChange={(event) => updateNewsPost(post.id, { status: event.target.value as NewsStatus, publishedAt: event.target.value === 'published' ? nowIso() : post.publishedAt }, 'News status updated.')}><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="published">Published</option></select><button className="button secondary" type="button" onClick={() => updateNewsPost(post.id, { featured: !post.featured }, post.featured ? 'Story removed from featured.' : 'Story featured.')}>{post.featured ? 'Unfeature' : 'Feature'}</button><button className="button danger" type="button" onClick={() => deleteNewsPost(post)}>Delete</button></div></article>) : <p>No news stories yet. Publish the first one below.</p>}</div></section>
              <section className="panel"><PanelHeading eyebrow="PUBLISH" title="New story" /><form className="form-grid" onSubmit={createNewsPost}><label>Headline<input name="headline" required /></label><label>Category<input name="category" defaultValue="EBG News" /></label><label>Author / byline<input name="author" defaultValue="EBG" /></label><label>Status<select name="status" defaultValue="draft"><option value="draft">Draft</option><option value="scheduled">Schedule</option><option value="published">Publish now</option></select></label><label>Publish at<input name="publishAt" type="datetime-local" /></label><label>Story image<input name="image" type="file" accept="image/*" /></label><label className="studio-news-featured"><input name="featured" type="checkbox" /> Feature this story</label><label className="full">Summary<textarea name="summary" required placeholder="A short description for cards and the homepage." /></label><label className="full">Article<textarea name="body" required placeholder="Write the full EBG News story here." /></label><div className="full"><button className="button" disabled={busy}>{busy ? 'Publishing…' : 'Save story'}</button></div></form></section>
            </>
          )}

`

must("          {tab === 'notifications' && (", newsWorkspace + "          {tab === 'notifications' && authState.account.role === 'founder' && (", 'news workspace and notification gate')

fs.writeFileSync(appPath, source)
console.log('Applied Studio Phase 1.57 founder news and notification controls.')
