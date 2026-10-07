import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { loadStudioInbox, loadStudioThread, markStudioThreadRead, sendStudioInboxMessage, setStudioConversationState, type StudioInboxForm, type StudioInboxMessage, type StudioInboxSubmission } from './inboxNetwork'
type Filter = 'all' | 'unread' | 'waiting' | 'resolved'
export default function StudioInbox() {
  const [forms,setForms]=useState<StudioInboxForm[]>([]), [submissions,setSubmissions]=useState<StudioInboxSubmission[]>([]), [messages,setMessages]=useState<StudioInboxMessage[]>([]), [thread,setThread]=useState<StudioInboxMessage[]>([]), [active,setActive]=useState<StudioInboxSubmission|null>(null), [filter,setFilter]=useState<Filter>('all'), [query,setQuery]=useState(''), [notice,setNotice]=useState(''), [loading,setLoading]=useState(true), [sending,setSending]=useState(false), [threadLoading,setThreadLoading]=useState(false)
  const selected=useRef<string|null>(null), alive=useRef(true), refreshing=useRef(false)
  const refresh=async()=>{
    if(refreshing.current) return
    refreshing.current=true
    try {
      const data=await loadStudioInbox()
      if(!alive.current) return
      setForms(data.forms);setSubmissions(data.submissions);setMessages(data.messages)
      const id=selected.current
      if(id) {
        const rows=await loadStudioThread(id)
        if(alive.current && selected.current===id) { setThread(rows);setActive(data.submissions.find(s=>s.id===id)??null);await markStudioThreadRead(id) }
      }
    } finally { refreshing.current=false; if(alive.current) setLoading(false) }
  }
  useEffect(()=>{
    alive.current=true
    void refresh().catch(e=>{if(alive.current)setNotice(e.message)})
    const timer=setInterval(()=>void refresh().catch(e=>{if(alive.current)setNotice(e.message)}),15000)
    return()=>{alive.current=false;selected.current=null;clearInterval(timer)}
  },[])
  const formTitle=(id:string)=>forms.find(f=>f.id===id)?.title??'Application'
  const name=(s:StudioInboxSubmission)=>String(s.answers?.legalName??s.answers?.legal_name??s.answers?.name??s.respondent_email??'Applicant')
  const unreadFor=(id:string)=>messages.filter(m=>m.submission_id===id&&!m.read_by_staff).length
  const latestFor=(id:string)=>messages.find(m=>m.submission_id===id)
  const visible=submissions.filter(s=>(filter==='all'||(filter==='unread'?unreadFor(s.id)>0:filter==='waiting'?s.conversation_state==='waiting_on_ebg':s.conversation_state==='resolved')) && `${name(s)} ${formTitle(s.form_id)} ${s.respondent_email??''}`.toLowerCase().includes(query.toLowerCase())).sort((a,b)=>Date.parse(latestFor(b.id)?.created_at??b.created_at)-Date.parse(latestFor(a.id)?.created_at??a.created_at))
  const open=async(sub:StudioInboxSubmission)=>{
    selected.current=sub.id;setActive(sub);setThread([]);setThreadLoading(true);setNotice('')
    try {const rows=await loadStudioThread(sub.id);if(selected.current!==sub.id||!alive.current)return;setThread(rows);await markStudioThreadRead(sub.id);setMessages(current=>current.map(m=>m.submission_id===sub.id?{...m,read_by_staff:true}:m))}
    catch(e){if(selected.current===sub.id)setNotice(e instanceof Error?e.message:'Could not load thread.')}
    finally{if(selected.current===sub.id)setThreadLoading(false)}
  }
  const send=async(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();if(!active||sending)return
    const el=event.currentTarget,data=new FormData(el),body=String(data.get('body')||'').trim(),id=active.id
    if(!body)return
    setSending(true);setNotice('')
    try{const row=await sendStudioInboxMessage(id,body,String(data.get('senderLabel')||'EBG Studio'));el.reset();if(selected.current===id)setThread(current=>[...current,row]);setMessages(current=>[row,...current]);setNotice('Message sent to the applicant’s EBG+ inbox.');void refresh().catch(()=>setNotice('Message sent. Refresh to reload the latest conversation.'))}
    catch(e){setNotice(e instanceof Error?e.message:'Could not send. Your message is still here.')}
    finally{setSending(false)}
  }
  const updateState=async(state:'open'|'waiting_on_ebg'|'waiting_on_applicant'|'resolved')=>{
    if(!active||sending)return;setSending(true)
    try{await setStudioConversationState(active.id,state);setActive({...active,conversation_state:state});setSubmissions(current=>current.map(s=>s.id===active.id?{...s,conversation_state:state}:s));setNotice('Conversation updated.')}
    catch(e){setNotice(e instanceof Error?e.message:'Could not update conversation.')}
    finally{setSending(false)}
  }
  return <div className="studio-inbox"><header><h2>Applicant inbox</h2><p>Read applications and reply directly in EBG+. Replies appear in the applicant’s inbox; this doesn’t send email.</p><button className="button secondary" disabled={loading||sending} onClick={()=>void refresh().catch(e=>setNotice(e.message))}>Refresh</button></header>{notice&&<p role="status">{notice}</p>}
    <div className="studio-inbox-toolbar"><label>Find a conversation<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Name, email, or form"/></label><div>{(['all','unread','waiting','resolved'] as Filter[]).map(value=><button type="button" key={value} className={filter===value?'active':''} onClick={()=>setFilter(value)}>{value==='waiting'?'Waiting on EBG':value}</button>)}</div><span>{visible.length} conversations</span></div>
    <div className="studio-inbox-layout"><section className="panel studio-inbox-list" aria-label="Conversations">{loading?<p>Loading inbox…</p>:!visible.length?<p>No conversations match. New form submissions appear here.</p>:visible.map(sub=><button type="button" className={`studio-inbox-row ${active?.id===sub.id?'active':''}`} key={sub.id} disabled={sending} onClick={()=>void open(sub)}><div><strong>{name(sub)}</strong><p>{latestFor(sub.id)?.body??formTitle(sub.form_id)}</p><small>{formTitle(sub.form_id)} · {sub.conversation_state?.replaceAll('_',' ')??'open'}</small></div>{unreadFor(sub.id)>0&&<b>{unreadFor(sub.id)}</b>}</button>)}</section>
    <section className="panel studio-inbox-thread">{!active?<p>Select a conversation to read the application and reply.</p>:<><div className="studio-inbox-thread-head"><div><h3>{name(active)}</h3><p>{formTitle(active.form_id)}</p></div><button type="button" className="button secondary" disabled={sending} onClick={()=>{selected.current=null;setActive(null);setThread([])}}>Close</button></div><details><summary>Application answers</summary>{Object.entries(active.answers??{}).map(([key,value])=><p key={key}><strong>{key.replaceAll('_',' ')}:</strong> {typeof value==='object'?JSON.stringify(value):String(value)}</p>)}</details><label>Conversation status<select disabled={sending} value={active.conversation_state??'open'} onChange={e=>void updateState(e.target.value as 'open'|'waiting_on_ebg'|'waiting_on_applicant'|'resolved')}><option value="open">Open</option><option value="waiting_on_ebg">Waiting on EBG</option><option value="waiting_on_applicant">Waiting on applicant</option><option value="resolved">Resolved</option></select></label><div className="studio-inbox-chat">{threadLoading?<p>Loading conversation…</p>:thread.length?thread.map(message=><article className={message.sender_account_id===active.submitted_by?'applicant':'staff'} key={message.id}><strong>{message.sender_account_id===active.submitted_by?'Applicant':message.sender_label||'EBG Team'}</strong><p>{message.body}</p><small>{new Date(message.created_at).toLocaleString()}</small></article>):<p>No messages yet. Start with a reply below.</p>}</div><form key={active.id} className="studio-inbox-compose" onSubmit={send}><label>Send as<select name="senderLabel" disabled={sending}><option>EBG Studio</option><option>EBG Casting</option><option>EBG Team</option></select></label><label className="full">Message<textarea name="body" required maxLength={5000} disabled={sending||threadLoading} placeholder="Write to the applicant…"/></label><button className="button" disabled={sending||threadLoading}>{sending?'Sending…':'Send reply'}</button></form></>}</section></div>
  </div>
}
