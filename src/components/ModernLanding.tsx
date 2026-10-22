import { useState } from 'react'
import { Link } from 'react-router-dom'
import BrandLogo from './BrandLogo'
import type { LiveTvConfig } from '../lib/liveTv'
import '../styles/modern-entrance.css'

type Title = { id: string; title: string; description: string; genre: string; category: string; status: string; artwork: string; banner?: string; homeVisible?: boolean; year: number }
export default function ModernLanding({ cms }: { cms: { shows: Title[]; heroShowId: string; liveTv?: LiveTvConfig } }) {
  const [menu, setMenu] = useState(false)
  const titles = cms.shows.filter(show => show.homeVisible !== false)
  const featured = titles.find(show => show.id === cms.heroShowId) ?? titles.find(show => show.status === 'Now Streaming') ?? titles[0]
  const channelCount = cms.liveTv?.channels.filter(channel => channel.enabled).length ?? 0
  const destinations = [['Shows', '/app/shows'], ['Movies', '/app/movies'], ['Live TV', '/app/live-tv'], ['Music', '/app/music']]
  return <main className="entrance">
    <a className="entrance-skip" href="#entrance-discover">Skip to content</a>
    <header className="entrance-header"><Link className="entrance-brand" to="/" aria-label="EBG+ home"><BrandLogo /></Link><nav aria-label="Main navigation">{destinations.map(([label, href]) => <Link to={href} key={href}>{label}</Link>)}<a href="#entrance-creators">For creators</a></nav><div className="entrance-account"><Link className="entrance-signin" to="/auth/sign-in">Sign in</Link><Link className="entrance-button entrance-join" to="/auth/create-account">Join EBG+</Link><button className="entrance-menu-toggle" type="button" aria-label={menu ? 'Close menu' : 'Open menu'} aria-expanded={menu} aria-controls="entrance-menu" onClick={() => setMenu(value => !value)}>{menu ? '✕' : '☰'}</button></div></header>
    {menu && <nav className="entrance-mobile-menu" id="entrance-menu" aria-label="Mobile main navigation">{destinations.map(([label, href]) => <Link to={href} key={href} onClick={() => setMenu(false)}>{label}<span aria-hidden="true">↗</span></Link>)}<a href="#entrance-creators" onClick={() => setMenu(false)}>For creators<span aria-hidden="true">↗</span></a><Link to="/auth/sign-in" onClick={() => setMenu(false)}>Sign in<span aria-hidden="true">↗</span></Link><Link to="/auth/create-account" onClick={() => setMenu(false)}>Create an account<span aria-hidden="true">+</span></Link></nav>}
    <section className="entrance-hero entrance-editorial" aria-labelledby="entrance-headline">
      <div className="entrance-editorial-top"><span>THE EBG+ EDITION <b>01 / ∞</b></span><span>SHOWS · MUSIC · MOVIES · LIVE</span></div>
      <div className="entrance-editorial-heading"><p className="entrance-eyebrow"><span /> YOUR NEXT OBSESSION STARTS HERE</p><h1 id="entrance-headline">STORIES<br /><span>HIT</span> DIFFERENT.</h1></div>
      <div className="entrance-editorial-art">
        {featured ? <Link to={`/app/shows/${featured.id}`} aria-label={`Explore ${featured.title}`}>
          {featured.banner || featured.artwork ? <img src={featured.banner || featured.artwork} alt="" fetchPriority="high" /> : <span className="entrance-editorial-art-fallback">EBG+ ORIGINAL</span>}
          <span className="entrance-editorial-art-caption">NOW IN THE SPOTLIGHT <b aria-hidden="true">↗</b></span>
        </Link> : <Link to="/app/shows"><span className="entrance-editorial-art-fallback">EBG+ ORIGINALS</span><span className="entrance-editorial-art-caption">EXPLORE THE STORIES ↗</span></Link>}
      </div>
      <div className="entrance-editorial-side"><span className="entrance-editorial-spark" aria-hidden="true">✳</span><p>Original stories. Independent sounds. A little more of everything you love, all in one place.</p><div className="entrance-editorial-current"><small>THE FEATURED STORY</small><strong>{featured?.title ?? 'Something good is coming'}</strong><span>{featured ? `${featured.genre} · ${featured.year}` : 'Only on EBG+'}</span></div></div>
      <div className="entrance-editorial-bottom"><Link className="entrance-editorial-ticket" to="/auth/create-account"><span>GET IN ON IT</span><strong>Join EBG+ <b aria-hidden="true">↗</b></strong></Link><p>PRESS PLAY ON<br />SOMETHING NEW.</p><Link className="entrance-editorial-discover" to="/app/shows">Explore what’s on <span aria-hidden="true">↗</span></Link></div>
    </section>
    <section className="entrance-worlds" aria-label="Explore EBG+">{[
      ['01', 'Watch', 'Get into a good story.', '/app/shows', '↗'],
      ['02', 'Listen', 'Find your new repeat.', '/app/music', '♫'],
      ['03', 'Live', 'Be there for the moment.', '/app/live-tv', '◉'],
    ].map(([number, title, copy, href, icon]) => <Link key={title} to={href}><span className="entrance-world-number">{number} / EBG+</span><div><h2>{title}</h2><span aria-hidden="true">{icon}</span></div><p>{copy}</p></Link>)}</section>
    <section className="entrance-section" id="entrance-discover"><div className="entrance-section-head"><div><p className="entrance-eyebrow">YOUR NEXT OBSESSION</p><h2>Something worth staying in for.</h2></div><Link to="/app/shows">Explore the collection <span aria-hidden="true">↗</span></Link></div>{titles.length ? <div className="entrance-title-rail">{titles.slice(0, 8).map((title, index) => <Link to={`/app/shows/${title.id}`} className="entrance-title" key={title.id}><div className={`entrance-poster entrance-poster-${index % 3}`}>{title.artwork || title.banner ? <img src={title.artwork || title.banner} alt="" loading="lazy" /> : <strong>{title.title}</strong>}<span>{title.status === 'Now Streaming' ? 'NOW STREAMING' : title.status.toUpperCase()}</span><b aria-hidden="true">↗</b></div><p>{title.genre}</p><h3>{title.title}</h3></Link>)}</div> : <div className="entrance-empty"><p>The next chapter is coming.</p><Link to="/auth/create-account">Join EBG+ to discover what’s next ↗</Link></div>}</section>
    <section className="entrance-live"><div className="entrance-live-orbit" aria-hidden="true"><span>LIVE</span><i /><i /><i /></div><div><p className="entrance-eyebrow"><span /> LESS SCROLLING. MORE TUNING IN.</p><h2>A little more<br /><em>in the moment.</em></h2><p>Pick a channel. Drop into a show. Catch something live. A shared screen, wherever you are.</p><Link className="entrance-button" to="/app/live-tv">Explore Live TV <span aria-hidden="true">↗</span></Link><small>{channelCount ? `${channelCount} ${channelCount === 1 ? 'channel' : 'channels'} in the lineup` : 'Discover the next broadcast as channels go on air.'}</small></div></section>
    <section className="entrance-creators" id="entrance-creators"><div><p className="entrance-eyebrow">INDEPENDENT DOESN’T MEAN ALONE.</p><h2>Made for the ones<br />making <em>something.</em></h2></div><div><p>Bring your stories, your sound, and your perspective. EBG+ Studio is your space to turn your next idea into someone’s next favorite.</p><a className="entrance-secondary" href="https://studio.ebgplus.app">Enter creator studio <span aria-hidden="true">↗</span></a></div></section>
    <footer className="entrance-footer"><div><Link to="/" aria-label="EBG+ home"><BrandLogo /></Link><p>Stories. Sounds. Your people.</p></div><nav aria-label="Footer navigation"><Link to="/about">About</Link><Link to="/help">Help</Link><Link to="/terms">Terms</Link><Link to="/privacy">Privacy</Link><Link to="/partnerships">Partnerships</Link></nav><small>© {new Date().getFullYear()} EBG+</small></footer>
  </main>
}
