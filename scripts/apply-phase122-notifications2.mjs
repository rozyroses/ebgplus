import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')
if (source.includes('// EBG_PHASE122_NOTIFICATIONS2')) process.exit(0)

const must = (pattern, replacement, label) => {
  const next = source.replace(pattern, replacement)
  if (next === source) throw new Error(`Phase 1.22 patch failed: ${label}`)
  source = next
}

must(
  "import './phase121-shows-grid.css'",
  "import './phase121-shows-grid.css'\nimport './phase122-notifications2.css'\n\n// EBG_PHASE122_NOTIFICATIONS2",
  'styles import',
)

must(
  `type NotificationItem = {\n  id: string\n  text: string\n  date: string\n  read: boolean\n}`,
  `type NotificationItem = {\n  id: string\n  text: string\n  date: string\n  read: boolean\n  title?: string\n  audience?: 'all' | 'members' | 'casting'\n  status?: 'draft' | 'scheduled' | 'sent'\n  link?: string\n}`,
  'notification publishing fields',
)

source = source.replace(
  '<Route path="notifications" element={<NotificationsPage cms={cms} />} />',
  '<Route path="notifications" element={<NotificationsPage cms={cms} account={account} castingApps={castingApps} />} />',
)

const notificationsPage = `function NotificationsPage({ cms, account, castingApps }: { cms: CmsData; account: Account; castingApps: CastingApplication[] }) {
  const storageKey = \`ebg.notifications.read.\${account.id}\`
  const [readIds, setReadIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) ?? '[]') as string[] } catch { return [] }
  })
  const isCastingApplicant = castingApps.some((app) => app.email.toLowerCase() === account.email.toLowerCase())
  const notifications = [...(cms.notifications ?? [])]
    .filter((notification) => {
      const status = notification.status ?? 'sent'
      if (status === 'draft') return false
      const publishAt = Date.parse(notification.date)
      if (status === 'scheduled' && !Number.isNaN(publishAt) && publishAt > Date.now()) return false
      if (notification.audience === 'casting' && !isCastingApplicant) return false
      return true
    })
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
  const unread = notifications.filter((notification) => !readIds.includes(notification.id)).length

  const markRead = (id: string) => {
    if (readIds.includes(id)) return
    const next = [...readIds, id]
    setReadIds(next)
    localStorage.setItem(storageKey, JSON.stringify(next))
  }
  const markAllRead = () => {
    const next = notifications.map((notification) => notification.id)
    setReadIds(next)
    localStorage.setItem(storageKey, JSON.stringify(next))
  }

  return (
    <main className="page notifications-v2">
      <div className="notifications-v2-head"><div><p className="eyebrow">EBG+ Inbox</p><h1>Notifications</h1><p>{unread ? \`\${unread} unread update\${unread === 1 ? '' : 's'}\` : 'You’re all caught up.'}</p></div>{unread > 0 && <button className="btn muted" type="button" onClick={markAllRead}>Mark all read</button>}</div>
      {notifications.length === 0 ? <div className="notifications-empty"><span>🔔</span><h2>No updates yet</h2><p>New releases, casting updates, polls, and EBG+ announcements will appear here.</p></div> : <div className="notifications-v2-list">{notifications.map((notification) => {
        const isRead = readIds.includes(notification.id)
        return <article className={\`notification-v2-card \${isRead ? 'read' : 'unread'}\`} key={notification.id} onMouseEnter={() => markRead(notification.id)}><div className="notification-v2-dot" aria-hidden="true" /><div><div className="notification-v2-meta"><span>{notification.audience === 'casting' ? 'Casting' : notification.audience === 'members' ? 'Members' : 'EBG+'}</span><time>{new Date(notification.date).toLocaleString()}</time></div><h2>{notification.title || 'EBG+ Update'}</h2><p>{notification.text}</p>{notification.link && <Link className="notification-v2-link" to={notification.link} onClick={() => markRead(notification.id)}>View update →</Link>}</div></article>
      })}</div>}
    </main>
  )
}`

must(/function NotificationsPage\([\s\S]*?\n\}\n\nfunction SettingsPage/, `${notificationsPage}\n\nfunction SettingsPage`, 'viewer notification center')

must(
  `const tabs = [['series','Series'],['episodes','Episodes'],['cast','Cast & Talent'],['polls','Polls & Voting'],['casting','Casting'],['media','Media'],['homepage','Homepage']]`,
  `const tabs = [['series','Series'],['episodes','Episodes'],['cast','Cast & Talent'],['polls','Polls & Voting'],['casting','Casting'],['media','Media'],['notifications','Notifications'],['homepage','Homepage']]`,
  'Studio notifications tab',
)

const helperNeedle = `  return (\n    <section className="ebg-studio-hub">`
const helper = `  const publishNotification = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formEl = event.currentTarget
    const form = new FormData(formEl)
    const action = String((event.nativeEvent as SubmitEvent).submitter && ((event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement).value || 'draft') as 'draft' | 'scheduled' | 'sent'
    const title = String(form.get('title') ?? '').trim()
    const text = String(form.get('text') ?? '').trim()
    const publishInput = String(form.get('publishAt') ?? '')
    if (!title || !text) return setMessage('Add a title and message first.')
    if (action === 'scheduled' && !publishInput) return setMessage('Choose a date and time before scheduling.')
    const date = action === 'sent' ? new Date().toISOString() : publishInput ? new Date(publishInput).toISOString() : new Date().toISOString()
    const notification: NotificationItem = {
      id: \`notice-\${Date.now()}\`,
      title,
      text,
      date,
      read: false,
      audience: String(form.get('audience') ?? 'all') as NotificationItem['audience'],
      status: action,
      link: String(form.get('link') ?? '').trim() || undefined,
    }
    onUpdateCms({ ...cms, notifications: [notification, ...(cms.notifications ?? [])] })
    formEl.reset()
    setMessage(action === 'sent' ? 'Notification sent.' : action === 'scheduled' ? 'Notification scheduled.' : 'Draft saved.')
  }

${helperNeedle}`
must(helperNeedle, helper, 'Studio notification publisher')

const notificationTab = `{tab === 'notifications' && <div className="studio-notifications-v2"><div className="studio-section-head"><div><h3>Notifications</h3><p>Write, preview, schedule, and publish updates to EBG+ viewers.</p></div><span>{(cms.notifications ?? []).length} total</span></div><form className="studio-form-grid notification-publisher" onSubmit={publishNotification}><label>Title<input name="title" required placeholder="New episode tonight" /></label><label>Audience<select name="audience" defaultValue="all"><option value="all">Everyone</option><option value="members">Signed-in members</option><option value="casting">Casting applicants</option></select></label><label className="full">Message<textarea name="text" required placeholder="Tell viewers what’s happening…" /></label><label>Schedule date & time<input name="publishAt" type="datetime-local" /></label><label>Optional EBG+ link<input name="link" placeholder="/app/shows/heartspell-house" /></label><div className="full notification-publish-actions"><button className="btn muted" type="submit" value="draft">Save Draft</button><button className="btn muted" type="submit" value="scheduled">Schedule</button><button className="btn" type="submit" value="sent">Send Now</button></div></form><div className="studio-stack notification-studio-list">{(cms.notifications ?? []).map((notification) => <div className="studio-row" key={notification.id}><div className="studio-row-copy"><div className="notification-studio-meta"><span className={\`notification-status-pill \${notification.status ?? 'sent'}\`}>{notification.status ?? 'sent'}</span><span>{notification.audience ?? 'all'}</span></div><strong>{notification.title || 'EBG+ Update'}</strong><p>{notification.text}</p><small>{new Date(notification.date).toLocaleString()}</small></div><button className="studio-delete-media" type="button" onClick={() => onUpdateCms({ ...cms, notifications:(cms.notifications ?? []).filter((item)=>item.id!==notification.id) })}>Delete</button></div>)}</div></div>}

      `

must(`{tab === 'homepage' &&`, `${notificationTab}{tab === 'homepage' &&`, 'Studio notifications workspace')

// Remove the legacy Notification Wall panel now that notifications live in the universal Studio tabs.
source = source.replace(/\n\s*<section className="panel">\n\s*<h2>Notification Wall<\/h2>[\s\S]*?<\/section>\n\s*<\/main>/, '\n    </main>')

fs.writeFileSync(path, source)
console.log('Applied EBG+ Phase 1.22 Notifications 2.0 publishing and viewer inbox.')
