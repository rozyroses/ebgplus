import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')
if (source.includes('// EBG_PHASE161_INBOX_NOTIFICATIONS')) process.exit(0)
const must=(pattern,replacement,label)=>{const next=source.replace(pattern,replacement);if(next===source)throw new Error(`Phase 1.61 patch failed: ${label}`);source=next}

must(
  "import './phase160-application-network.css'",
  "import './phase160-application-network.css'\nimport { loadInboxNetwork, loadInboxThread, sendInboxMessage, markInboxThreadRead, markOneNetworkNotificationRead, markAllNetworkNotificationsRead, type InboxSubmission, type InboxMessage, type InboxNotification } from './lib/inboxData'\nimport './phase161-inbox-notifications.css'\n\n// EBG_PHASE161_INBOX_NOTIFICATIONS",
  'inbox imports',
)

must(
  '<Route path="applications" element={<MyApplicationsPage cms={cms} />} />',
  '<Route path="applications" element={<MyApplicationsPage cms={cms} />} />\n        <Route path="inbox" element={<NetworkInboxPage cms={cms} />} />',
  'inbox route',
)

source = source.replace(
  '<Link to="/app/applications" onClick={closeWaffle}>My Applications</Link><Link to="/app/notifications" onClick={closeWaffle}>Notifications</Link>',
  '<Link to="/app/applications" onClick={closeWaffle}>My Applications</Link><Link to="/app/inbox" onClick={closeWaffle}>Messages</Link><Link to="/app/notifications" onClick={closeWaffle}>Notifications</Link>',
)

const inboxPage=`function NetworkInboxPage({ cms }: { cms: CmsData }) {
  const [submissions,setSubmissions]=useState<InboxSubmission[]>([])
  const [messages,setMessages]=useState<InboxMessage[]>([])
  const [forms,setForms]=useState<Array<{id:string;title:string;slug:string;eyebrow:string}>>([])
  const [active,setActive]=useState<InboxSubmission|null>(null)
  const [thread,setThread]=useState<InboxMessage[]>([])
  const [filter,setFilter]=useState<'all'|'unread'|'active'>('all')
  const [state,setState]=useState('Loading messages…')
  const refresh=async()=>{try{const data=await loadInboxNetwork();setSubmissions(data.submissions);setMessages(data.messages);setForms(data.forms);setState('')}catch(error){setState(error instanceof Error?error.message:'Inbox could not be loaded.')}}
  useEffect(()=>{void refresh();const timer=window.setInterval(()=>void refresh(),4000);return()=>window.clearInterval(timer)},[])
  const formTitle=(id:string)=>forms.find(f=>f.id===id)?.title??cms.shows.find(show=>show.id===id)?.title??'EBG Application'
  const unreadFor=(id:string)=>messages.filter(message=>message.submission_id===id&&!message.read_by_applicant).length
  const latestFor=(id:string)=>messages.find(message=>message.submission_id===id)
  const visible=submissions.filter(sub=>filter==='all'||(filter==='unread'?unreadFor(sub.id)>0:sub.conversation_state!=='resolved'))
  const openThread=async(sub:InboxSubmission)=>{setActive(sub);await markInboxThreadRead(sub.id).catch(()=>{});setThread(await loadInboxThread(sub.id));await refresh()}
  const send=async(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();if(!active)return;const el=event.currentTarget;const data=new FormData(el);const body=String(data.get('body')??'').trim();if(!body)return;await sendInboxMessage(active.id,body);el.reset();setThread(await loadInboxThread(active.id));await refresh()}
  return <main className="page ebg-inbox-page"><section className="ebg-inbox-hero"><div><p className="eyebrow">EBG+ MESSAGES</p><h1>Inbox</h1><p>Private conversations with EBG about your applications, callbacks, and next steps.</p></div><div className="ebg-inbox-count"><strong>{submissions.reduce((sum,sub)=>sum+unreadFor(sub.id),0)}</strong><span>unread</span></div></section>
    <div className="ebg-inbox-filters"><button className={filter==='all'?'active':''} onClick={()=>setFilter('all')}>All</button><button className={filter==='unread'?'active':''} onClick={()=>setFilter('unread')}>Unread</button><button className={filter==='active'?'active':''} onClick={()=>setFilter('active')}>Active</button></div>
    {state&&<p className="panel">{state}</p>}
    {!state&&!visible.length&&<section className="ebg-inbox-empty"><span>✉</span><h2>No messages here yet.</h2><p>When EBG contacts you about an application, the conversation will appear here.</p></section>}
    <section className="ebg-inbox-list">{visible.map(sub=>{const latest=latestFor(sub.id);const unread=unreadFor(sub.id);return <button key={sub.id} className={'ebg-inbox-row '+(unread?'unread':'')} onClick={()=>void openThread(sub)}><div className="ebg-inbox-avatar">EBG</div><div className="ebg-inbox-copy"><div><strong>{formTitle(sub.form_id)}</strong><span>{sub.conversation_state?.replaceAll('_',' ')??'open'}</span></div><p>{latest?.body??'Application submitted. Start a conversation with EBG.'}</p><small>{new Date(latest?.created_at??sub.created_at).toLocaleString()}</small></div>{unread>0&&<b>{unread}</b>}</button>})}</section>
    {active&&<div className="ebg-inbox-overlay"><section className="ebg-inbox-thread"><header><div><p className="eyebrow">PRIVATE EBG THREAD</p><h2>{formTitle(active.form_id)}</h2><span>{active.conversation_state?.replaceAll('_',' ')??'open'}</span></div><button onClick={()=>setActive(null)}>×</button></header><div className="ebg-inbox-chat">{thread.map(message=><article className={message.sender_account_id===active.submitted_by?'mine':'theirs'} key={message.id}><strong>{message.sender_account_id===active.submitted_by?'You':message.sender_label||'EBG Team'}</strong><p>{message.body}</p><small>{new Date(message.created_at).toLocaleString()}</small></article>)}</div><form onSubmit={send}><textarea name="body" required placeholder="Write a message to EBG…"/><button className="btn">Send</button></form></section></div>}
  </main>
}

`
must('function MyApplicationsPage(',inboxPage+'function MyApplicationsPage(','inbox component')

const notificationsPage=`function NotificationsPage({ cms, account, castingApps }: { cms: CmsData; account: Account; castingApps: CastingApplication[] }) {
  const storageKey = \`ebg.notifications.read.\${account.id}\`
  const [network,setNetwork]=useState<InboxNotification[]>([])
  const [readIds,setReadIds]=useState<string[]>(()=>{try{return JSON.parse(localStorage.getItem(storageKey)??'[]') as string[]}catch{return[]}})
  const [loading,setLoading]=useState(true)
  const isCastingApplicant=castingApps.some(app=>app.email.toLowerCase()===account.email.toLowerCase())
  const refresh=async()=>{try{const data=await loadInboxNetwork();setNetwork(data.notifications)}finally{setLoading(false)}}
  useEffect(()=>{void refresh();const timer=window.setInterval(()=>void refresh(),5000);return()=>window.clearInterval(timer)},[])
  const cmsNotices=[...(cms.notifications??[])].filter(n=>{const status=n.status??'sent';if(status==='draft')return false;const publishAt=Date.parse(n.date);if(status==='scheduled'&&!Number.isNaN(publishAt)&&publishAt>Date.now())return false;if(n.audience==='casting'&&!isCastingApplicant)return false;return true}).sort((a,b)=>Date.parse(b.date)-Date.parse(a.date))
  const unreadNetwork=network.filter(n=>!n.read).length
  const unreadCms=cmsNotices.filter(n=>!readIds.includes(n.id)).length
  const markCms=(id:string)=>{if(readIds.includes(id))return;const next=[...readIds,id];setReadIds(next);localStorage.setItem(storageKey,JSON.stringify(next))}
  const markAll=async()=>{await markAllNetworkNotificationsRead().catch(()=>{});const ids=cmsNotices.map(n=>n.id);setReadIds(ids);localStorage.setItem(storageKey,JSON.stringify(ids));await refresh()}
  return <main className="page notifications-v2 network-notifications-page"><div className="notifications-v2-head"><div><p className="eyebrow">EBG+ NOTIFICATIONS</p><h1>Notifications</h1><p>{unreadNetwork+unreadCms?\`${unreadNetwork+unreadCms} unread update\${unreadNetwork+unreadCms===1?'':'s'}\`:'You’re all caught up.'}</p></div>{unreadNetwork+unreadCms>0&&<button className="btn muted" onClick={()=>void markAll()}>Mark all read</button>}</div>
    {loading&&<p className="panel">Loading notifications…</p>}
    <div className="network-notification-list">{network.map(n=><button key={n.id} className={'network-notification-card '+(n.read?'read':'unread')} onClick={()=>{void markOneNetworkNotificationRead(n.id).then(refresh)}}><span className="network-notification-icon">{n.kind==='application_message'?'✉':'✓'}</span><div><small>{n.kind==='application_message'?'MESSAGE':'APPLICATION UPDATE'} · {new Date(n.created_at).toLocaleString()}</small><strong>{n.title}</strong><p>{n.text}</p>{n.link&&<Link to={n.link}>Open →</Link>}</div></button>)}</div>
    {!!cmsNotices.length&&<section className="network-announcements"><h2>From EBG+</h2><div className="notifications-v2-list">{cmsNotices.map(n=>{const read=readIds.includes(n.id);return <article className={'notification-v2-card '+(read?'read':'unread')} key={n.id}><div className="notification-v2-dot"/><div><div className="notification-v2-meta"><span>EBG+</span><time>{new Date(n.date).toLocaleString()}</time></div><h2>{n.title||'EBG+ Update'}</h2><p>{n.text}</p>{n.link&&<Link className="notification-v2-link" to={n.link} onClick={()=>markCms(n.id)}>View update →</Link>}<button className="notification-read-button" onClick={()=>markCms(n.id)}>{read?'Read':'Mark read'}</button></div></article>})}</div></section>}
  </main>
}`
must(/function NotificationsPage\([\s\S]*?\n}\n\nfunction SettingsPage/,notificationsPage+'\n\nfunction SettingsPage','notifications center')

fs.writeFileSync(path,source)
console.log('Applied Phase 1.61 EBG Inbox and unified notifications.')
