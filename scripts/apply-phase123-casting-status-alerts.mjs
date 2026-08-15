import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')
if (source.includes('// EBG_PHASE123_CASTING_ALERTS')) process.exit(0)

const must = (pattern, replacement, label) => {
  const next = source.replace(pattern, replacement)
  if (next === source) throw new Error(`Phase 1.23 patch failed: ${label}`)
  source = next
}

must(
  "import './phase122-notifications2.css'",
  "import './phase122-notifications2.css'\n\n// EBG_PHASE123_CASTING_ALERTS",
  'integration marker',
)

const notificationsPage = `function NotificationsPage({ cms, account }: { cms: CmsData; account: Account; castingApps: CastingApplication[] }) {
  const storageKey = \`ebg.notifications.read.\${account.id}\`
  const [readIds, setReadIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) ?? '[]') as string[] } catch { return [] }
  })
  const [myApplications, setMyApplications] = useState<ViewerApplication[]>([])

  useEffect(() => {
    let active = true
    void loadMyCastingApplications()
      .then((rows) => { if (active) setMyApplications(rows) })
      .catch((error) => console.error('Could not load casting alerts.', error))
    return () => { active = false }
  }, [])

  const castingStatusCopy = (status: string) => {
    const value = status.toLowerCase()
    if (value === 'new') return { title:'Application received', text:'EBG Casting received your application and it is now in the queue.' }
    if (value === 'reviewing') return { title:'Application under review', text:'The EBG Casting team is currently reviewing your application.' }
    if (value === 'callback') return { title:'Callback 🎉', text:'EBG Casting would like to continue with your application. Check your email for next-step details.' }
    if (value === 'interview') return { title:'Interview stage', text:'Your application has moved to the interview stage. Keep an eye on your email for scheduling details.' }
    if (value === 'finalist') return { title:'Final review', text:'You have reached the final review stage. EBG Casting will contact you when a decision is ready.' }
    if (value === 'cast') return { title:'You’re selected! 🎉', text:'You have been selected by EBG Casting. Follow the instructions sent to you for your next steps.' }
    if (value === 'declined' || value === 'removed') return { title:'Casting update', text:'This casting cycle has closed for your application. Thank you for taking the time to apply.' }
    return { title:'Application update', text:'There is a new update on your EBG casting application.' }
  }

  const showTitle = (showId: string) => cms.shows.find((show) => show.id === showId)?.title ?? showId.replaceAll('-', ' ')
  const castingNotifications: NotificationItem[] = myApplications.map((application) => {
    const copy = castingStatusCopy(application.status)
    return {
      id: \`casting-\${application.id}-\${application.status.toLowerCase()}\`,
      title: \`\${showTitle(application.show_id)} · \${copy.title}\`,
      text: copy.text,
      date: application.created_at,
      read: false,
      audience: 'casting',
      status: 'sent',
      link: '/app/applications',
    }
  })

  const editorialNotifications = [...(cms.notifications ?? [])]
    .filter((notification) => {
      const status = notification.status ?? 'sent'
      if (status === 'draft') return false
      const publishAt = Date.parse(notification.date)
      if (status === 'scheduled' && !Number.isNaN(publishAt) && publishAt > Date.now()) return false
      if (notification.audience === 'casting' && myApplications.length === 0) return false
      return true
    })

  const notifications = [...castingNotifications, ...editorialNotifications]
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

must(/function NotificationsPage\([\s\S]*?\n\}\n\nfunction SettingsPage/, `${notificationsPage}\n\nfunction SettingsPage`, 'private casting status notifications')

fs.writeFileSync(path, source)
console.log('Applied EBG+ Phase 1.23 automatic private casting-status notifications.')
