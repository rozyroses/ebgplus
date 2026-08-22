import fs from 'node:fs'

const path = new URL('../src/App.tsx', import.meta.url)
let source = fs.readFileSync(path, 'utf8')
if (source.includes('// EBG_PHASE160_APPLICATION_NETWORK')) process.exit(0)
const must=(pattern,replacement,label)=>{const next=source.replace(pattern,replacement);if(next===source)throw new Error(`Phase 1.60 patch failed: ${label}`);source=next}

must(
  "import './phase159-forms-v2.css'",
  "import './phase159-forms-v2.css'\nimport { loadApplicantNetwork, loadApplicantMessages, sendApplicantMessage, markNotificationRead, type ApplicantSubmission, type ApplicantMessage, type AccountNotification } from './lib/applicationNetworkData'\nimport './phase160-application-network.css'\n\n// EBG_PHASE160_APPLICATION_NETWORK",
  'network imports',
)

must(
  "  notifications: NotificationItem[]\n}",
  "  notifications: NotificationItem[]\n  verifiedBadge?: 'artist' | 'founder' | null\n}",
  'account verification field',
)

must(
  "    role: state.account.role,\n    profiles:",
  "    role: state.account.role,\n    verifiedBadge: state.account.verified_badge ?? (state.account.role === 'founder' ? 'founder' : null),\n    profiles:",
  'verified account mapping',
)

source = source.replace(
  '<strong className="profile-name-v2">{entry.name}</strong>',
  '<strong className="profile-name-v2">{entry.name}{account.verifiedBadge && <span className="verified-badge" title={account.verifiedBadge + " verified"}>✓</span>}</strong>',
)

const component=`function MyApplicationsPage({ cms }: { cms: CmsData }) {
  const [submissions,setSubmissions]=useState<ApplicantSubmission[]>([])
  const [forms,setForms]=useState<Array<{id:string;title:string;slug:string;eyebrow:string}>>([])
  const [notices,setNotices]=useState<AccountNotification[]>([])
  const [active,setActive]=useState<ApplicantSubmission|null>(null)
  const [messages,setMessages]=useState<ApplicantMessage[]>([])
  const [state,setState]=useState('Loading your application center…')

  const refresh=async()=>{try{const data=await loadApplicantNetwork();setSubmissions(data.submissions);setForms(data.forms);setNotices(data.notifications);setState('')}catch(error){setState(error instanceof Error?error.message:'Applications could not be loaded.')}}
  useEffect(()=>{void refresh();const timer=window.setInterval(()=>void refresh(),5000);return()=>window.clearInterval(timer)},[])

  const openThread=async(submission:ApplicantSubmission)=>{setActive(submission);try{setMessages(await loadApplicantMessages(submission.id))}catch(error){setState(error instanceof Error?error.message:'Messages could not be loaded.')}}
  const send=async(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();if(!active)return;const el=event.currentTarget;const data=new FormData(el);const body=String(data.get('body')??'').trim();if(!body)return;await sendApplicantMessage(active.id,body);el.reset();setMessages(await loadApplicantMessages(active.id))}
  const statusCopy=(status:string)=>({new:['Submitted','Your application has been received.'],reviewing:['Under Review','The EBG team is reviewing your application.'],contacted:['Next Step','EBG has reached out with a next step. Check your messages.'],accepted:['Accepted','You have been selected. 🎉'],declined:['Closed','This application cycle has closed. Thank you for applying.']}[status]??['In Progress','Your application is still active.'])
  const formTitle=(id:string)=>forms.find(form=>form.id===id)?.title??cms.shows.find(show=>show.id===id)?.title??'EBG Application'

  return <main className="applications-page application-network-page">
    <section className="applications-hero"><p className="eyebrow">EBG APPLICATION CENTER</p><h1>My Applications</h1><p>Status updates, official messages, and every application you’ve submitted to the EBG network — all in one place.</p><a className="btn" href="https://forms.ebgplus.app">Browse open forms</a></section>
    {state&&<p className="panel">{state}</p>}
    {!!notices.length&&<section className="application-notice-panel"><div className="application-section-head"><h2>Updates</h2><span>{notices.filter(n=>!n.read).length} unread</span></div><div className="application-notices">{notices.slice(0,8).map(n=><button key={n.id} className={n.read?'read':''} onClick={()=>{void markNotificationRead(n.id).then(refresh)}}><strong>{n.title}</strong><span>{n.text}</span><small>{new Date(n.created_at).toLocaleString()}</small></button>)}</div></section>}
    {!state&&!submissions.length&&<section className="applications-empty"><h2>No applications yet.</h2><p>Sign in before submitting a form and it will appear here automatically.</p><a className="btn" href="https://forms.ebgplus.app">Explore EBG Forms</a></section>}
    <section className="application-network-grid">{submissions.map(sub=>{const copy=statusCopy(sub.status);return <article className="application-network-card" key={sub.id}><div className="application-card-head"><div><p className="eyebrow">{formTitle(sub.form_id)}</p><h2>{String(sub.answers?.legalName??sub.respondent_email??'Application')}</h2><small>Submitted {new Date(sub.created_at).toLocaleDateString()}</small></div><span className={'application-status '+sub.status}>{copy[0]}</span></div><p>{copy[1]}</p><div className="application-answer-preview">{Object.entries(sub.answers).slice(0,4).map(([key,value])=><div key={key}><small>{key.replaceAll('_',' ')}</small><span>{String(value)}</span></div>)}</div><button className="btn muted" onClick={()=>void openThread(sub)}>Messages & details</button></article>})}</section>
    {active&&<div className="application-thread-overlay"><section className="application-thread"><div className="application-thread-head"><div><p className="eyebrow">PRIVATE APPLICATION THREAD</p><h2>{formTitle(active.form_id)}</h2></div><button onClick={()=>setActive(null)}>×</button></div><div className="application-thread-answers">{Object.entries(active.answers).map(([key,value])=><div key={key}><small>{key.replaceAll('_',' ')}</small><span>{String(value)}</span></div>)}</div><div className="application-chat">{messages.map(msg=><article key={msg.id}><strong>{msg.sender_account_id===active.submitted_by?'You':'EBG Team'}</strong><p>{msg.body}</p><small>{new Date(msg.created_at).toLocaleString()}</small></article>)}</div><form onSubmit={send}><textarea name="body" required placeholder="Message the EBG team about this application…"/><button className="btn">Send message</button></form></section></div>}
  </main>
}

`
must(/function MyApplicationsPage\([\s\S]*?\n}\n\nfunction MyListPage/,component+'function MyListPage','application center')

fs.writeFileSync(path,source)
console.log('Applied Phase 1.60 applicant messaging, updates, and verification support.')
