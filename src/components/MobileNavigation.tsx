import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation } from 'react-router-dom'
import BrandLogo from './BrandLogo'

const quickLinks = [['Home', '/app/home', 'home'], ['Live TV', '/app/live-tv', 'live'], ['Browse', '/app/shows', 'browse'], ['Music', '/app/music', 'music'], ['You', '/app/settings', 'user']]
function Icon({ name }: { name: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{name === 'home' ? <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" /><path d="M9 21v-8h6v8" /></> : name === 'live' ? <><rect x="3" y="6" width="18" height="14" rx="3" /><path d="m8 2 4 4 4-4" /><path d="m10 10 5 3-5 3z" /></> : name === 'browse' ? <><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></> : name === 'music' ? <><path d="M9 17V5l11-2v12M9 8l11-2" /><ellipse cx="6" cy="18" rx="3" ry="3" /><ellipse cx="17" cy="16" rx="3" ry="3" /></> : <><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></>}</svg>
}
export default function MobileNavigation({ canManage, onSignOut }: { canManage: boolean; onSignOut: () => void }) {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const button = useRef<HTMLButtonElement>(null)
  const dialog = useRef<HTMLDivElement>(null)
  useEffect(() => { setOpen(false) }, [location.pathname, location.search])
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const first = dialog.current?.querySelector<HTMLButtonElement>('button')
    first?.focus()
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); button.current?.focus() }
      if (event.key === 'Tab') {
        const items = [...(dialog.current?.querySelectorAll<HTMLElement>('a,button') ?? [])]
        const first = items[0], last = items[items.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      }
    }
    document.addEventListener('keydown', key)
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', key) }
  }, [open])
  return createPortal(<div className="viewer-mobile">
    <button className="viewer-menu-button" type="button" ref={button} aria-label="Open navigation" aria-expanded={open} aria-controls="viewer-menu" onClick={() => setOpen(true)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h10" /></svg></button>
    <nav className="viewer-tabbar" aria-label="Mobile quick navigation">{quickLinks.map(([label, to, icon]) => <Link key={to} to={to} aria-current={(location.pathname.startsWith(to) || (label === 'Browse' && location.pathname.startsWith('/app/movies'))) ? 'page' : undefined}><Icon name={icon} /><span>{label}</span></Link>)}</nav>
    {open && <div className="viewer-menu-layer"><button className="viewer-menu-backdrop" type="button" aria-label="Dismiss navigation" onClick={() => { setOpen(false); button.current?.focus() }} /><div id="viewer-menu" className="viewer-menu-panel" role="dialog" aria-modal="true" aria-label="Navigation menu" ref={dialog}><header><BrandLogo /><button type="button" aria-label="Close navigation" onClick={() => { setOpen(false); button.current?.focus() }}>✕</button></header><nav aria-label="Browse EBG+">{[['Home','/app/home'],['Shows','/app/shows'],['Movies & specials','/app/movies'],['Live TV','/app/live-tv'],['Music','/app/music'],['Search','/app/search'],['My list','/app/my-list'],['Messages','/app/inbox'],['Notifications','/app/notifications'],['Settings','/app/settings'],['Switch profile','/profiles']].map(([label, href]) => <Link key={href} to={href}>{label}<span aria-hidden="true">↗</span></Link>)}{canManage && <><Link to="/app/studio/live-tv">Manage Live TV<span aria-hidden="true">↗</span></Link><Link to="/app/studio/broadcast">Go live<span aria-hidden="true">◉</span></Link></>}<a href="https://studio.ebgplus.app">Creator studio<span aria-hidden="true">↗</span></a><button type="button" onClick={() => { setOpen(false); onSignOut() }}>Sign out</button></nav></div></div>}
  </div>, document.body)
}
