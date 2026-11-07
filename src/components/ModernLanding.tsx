import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import BrandLogo from './BrandLogo'
import type { LiveTvConfig } from '../lib/liveTv'

type Title = { id: string; title: string; description: string; genre: string; category: string; status: string; artwork: string; banner?: string; homeVisible?: boolean; year: number }
const destinations = [['Discover', '#discover'], ['Shows', '/app/shows'], ['Movies', '/app/movies'], ['Music', '/app/music'], ['Live TV', '/app/live-tv']]
function Arrow() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg> }
function Play() { return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m8 5 12 7-12 7z" /></svg> }

export default function ModernLanding({ cms }: { cms: { shows: Title[]; heroShowId: string; liveTv?: LiveTvConfig } }) {
  const titles = cms.shows.filter(show => show.homeVisible !== false)
  const initial = titles.findIndex(show => show.id === cms.heroShowId)
  const [activeId, setActiveId] = useState<string | null>(null)
  const featured = titles.find(show => show.id === activeId) ?? titles[Math.max(0, initial)]
  const [menu, setMenu] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)
  const menuPanel = useRef<HTMLDivElement>(null)
  const channelCount = cms.liveTv?.channels.filter(channel => channel.enabled).length ?? 0
  useEffect(() => {
    if (!menu) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    menuPanel.current?.querySelector<HTMLElement>('button')?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setMenu(false); menuButton.current?.focus() }
      if (event.key === 'Tab') {
        const items = [...(menuPanel.current?.querySelectorAll<HTMLElement>('a,button') ?? [])]
        const first = items[0], last = items[items.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', onKey) }
  }, [menu])
  const closeMenu = () => { setMenu(false); menuButton.current?.focus() }
  return <main className="cinema-landing">
    <a className="cinema-skip" href="#discover">Skip to content</a>
    <header className="cinema-header">
      <Link className="cinema-brand" to="/" aria-label="EBG+ home"><BrandLogo /></Link>
      <nav aria-label="Main navigation">{destinations.map(([label, href]) => href.startsWith('#') ? <a key={href} href={href}>{label}</a> : <Link key={href} to={href}>{label === 'Live TV' && <i className="cinema-live-dot" />}{label}</Link>)}</nav>
      <div className="cinema-header-actions"><Link className="cinema-signin" to="/auth/sign-in">Sign in</Link><Link className="cinema-button cinema-button-primary" to="/auth/create-account">Join EBG+ <Arrow /></Link><button ref={menuButton} type="button" className="cinema-menu-toggle" aria-label="Open navigation" aria-expanded={menu} aria-controls="cinema-menu" onClick={() => setMenu(true)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg></button></div>
    </header>
    {menu && <div className="cinema-menu-layer"><button className="cinema-menu-backdrop" aria-label="Dismiss navigation" onClick={closeMenu} /><div ref={menuPanel} id="cinema-menu" className="cinema-menu-panel" role="dialog" aria-modal="true" aria-label="Navigation"><header><BrandLogo /><button type="button" aria-label="Close navigation" onClick={closeMenu}>✕</button></header><nav aria-label="Mobile main navigation">{destinations.map(([label, href]) => href.startsWith('#') ? <a key={href} href={href} onClick={closeMenu}>{label}<Arrow /></a> : <Link key={href} to={href} onClick={closeMenu}>{label}<Arrow /></Link>)}<a href="https://studio.ebgplus.app">Creator studio <Arrow /></a><Link to="/auth/sign-in" onClick={closeMenu}>Sign in <Arrow /></Link></nav></div></div>}
    <section className={`cinema-hero ${featured?.banner || featured?.artwork ? 'has-artwork' : ''}`} aria-labelledby="cinema-title">
      {featured && (featured.banner || featured.artwork) ? <img key={featured.id} className="cinema-hero-image" src={featured.banner || featured.artwork} alt="" fetchPriority="high" /> : <div className="cinema-hero-fallback" aria-hidden="true"><span>ebg</span><b>+</b></div>}
      <div className="cinema-hero-shade" />
      <div className="cinema-hero-content" aria-live="polite" aria-atomic="true">
        <p className="cinema-kicker"><span className="cinema-plus">+</span> ORIGINAL VOICES. CENTER STAGE.</p>
        <div className="cinema-feature-meta"><span>{featured?.status ?? 'WELCOME TO EBG+'}</span><span>{featured?.genre ?? 'Shows · Music · Live'}</span>{featured?.year && <span>{featured.year}</span>}</div>
        <h1 id="cinema-title">{featured?.title ?? <>Find your<br />next obsession.</>}</h1>
        <p className="cinema-hero-description">{featured?.description || 'Original stories. Independent sounds. Live moments. Find something that stays with you.'}</p>
        <div className="cinema-hero-actions"><Link className="cinema-button cinema-button-primary" to={featured ? `/app/shows/${featured.id}` : '/app/shows'}><Play />{featured ? 'Explore title' : 'Explore EBG+'}</Link><a className="cinema-button cinema-button-ghost" href="#discover">Discover more <Arrow /></a></div>
      </div>
      <div className="cinema-hero-foot"><span>YOUR WORLD. ON PLAY.</span>{titles.length > 1 && <div className="cinema-feature-controls" role="group" aria-label="Choose featured title">{titles.slice(0, 6).map((title, index) => <button key={title.id} type="button" aria-label={`Feature ${title.title}`} aria-pressed={featured?.id === title.id} onClick={() => setActiveId(title.id)}><span>{String(index + 1).padStart(2, '0')}</span><i /></button>)}</div>}<a href="#discover" aria-label="Scroll to discover">↓</a></div>
    </section>
    <section id="discover" className="cinema-discovery" aria-labelledby="discovery-title">
      <div className="cinema-section-heading"><div><p className="cinema-kicker">THE EBG+ COLLECTION</p><h2 id="discovery-title">Worth pressing play.</h2></div><Link to="/app/shows">Explore all <Arrow /></Link></div>
      {titles.length ? <div className="cinema-title-rail">{titles.slice(0, 8).map((title, index) => <Link className="cinema-title-card" to={`/app/shows/${title.id}`} key={title.id}><div className={`cinema-poster cinema-poster-${index % 3}`}>{title.artwork || title.banner ? <img src={title.artwork || title.banner} alt="" loading="lazy" /> : <strong>{title.title}</strong>}<span className="cinema-poster-tag">{title.status}</span><span className="cinema-poster-play"><Play /></span></div><h3>{title.title}</h3><p>{title.genre} <span>· {title.year}</span></p></Link>)}</div> : <div className="cinema-empty"><h3>Your next favorite is on the way.</h3><p>Join EBG+ and discover new stories as they arrive.</p><Link className="cinema-button cinema-button-ghost" to="/auth/create-account">Create an account <Arrow /></Link></div>}
    </section>
    <section className="cinema-worlds" aria-label="Find your entertainment">
      <Link to="/app/shows" className="cinema-world cinema-watch"><span className="cinema-kicker">STORIES THAT PULL YOU IN</span><div><h2>Watch.</h2><Play /></div><p>Original shows, movies, and a new point of view.</p><span className="cinema-world-link">Explore the collection <Arrow /></span></Link>
      <Link to="/app/music" className="cinema-world cinema-listen"><span className="cinema-kicker">FIND YOUR FREQUENCY</span><div><h2>Listen.</h2><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M9 29v-7a15 15 0 0 1 30 0v7M9 25H5v13h8V25zm30 0h4v13h-8V25z" /></svg></div><p>Independent artists. New sounds. On repeat.</p><span className="cinema-world-link">Discover music <Arrow /></span></Link>
      <Link to="/app/live-tv" className="cinema-world cinema-live"><span className="cinema-kicker"><i className="cinema-live-dot" /> IN THE MOMENT</span><div><h2>Tune in.</h2><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="24" cy="24" r="4" /><path d="M16 16a11 11 0 0 0 0 16m16-16a11 11 0 0 1 0 16M10 10a20 20 0 0 0 0 28m28-28a20 20 0 0 1 0 28" /></svg></div><p>{channelCount ? `${channelCount} ${channelCount === 1 ? 'channel' : 'channels'}. One shared moment. Pick your screen.` : 'Shared screens. Live moments. See what’s on.'}</p><span className="cinema-world-link">Open Live TV <Arrow /></span></Link>
    </section>
    <section className="cinema-creator" id="creators"><div><p className="cinema-kicker">BEHIND EVERY PLAY, A CREATOR.</p><h2>Your vision.<br /><span>A bigger stage.</span></h2><p>Bring your stories and your sound to EBG+. Create with Lumi, manage your releases, and make your next move in Studio.</p><a className="cinema-button cinema-button-ghost" href="https://studio.ebgplus.app">Enter creator studio <Arrow /></a></div><div className="cinema-creator-art" aria-hidden="true"><div><span>CREATE</span><span>RELEASE</span><span>REPEAT<span className="cinema-plus">+</span></span></div><small>EBG+ STUDIO / MADE BY YOU</small></div></section>
    <section className="cinema-join"><p className="cinema-kicker">MAKE YOURSELF AT HOME</p><h2>What’s your next favorite?</h2><Link className="cinema-button cinema-button-primary" to="/auth/create-account">Find it on EBG+ <Arrow /></Link></section>
    <footer className="cinema-footer"><div><Link to="/" aria-label="EBG+ home"><BrandLogo /></Link><p>Original voices. All together.</p></div><nav aria-label="Footer navigation"><Link to="/about">About</Link><Link to="/help">Help</Link><Link to="/terms">Terms</Link><Link to="/privacy">Privacy</Link><Link to="/partnerships">Partnerships</Link></nav><small>© {new Date().getFullYear()} EBG+</small></footer>
  </main>
}
