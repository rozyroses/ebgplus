import { useEffect, useState } from 'react'
import { db } from '../../src/lib/supabase'
import { cleanPlatformLinks, platforms } from './musicDistribution'
import type { Platform } from './musicDistribution'

type Release = { id: string; artistId: string; title: string; cover?: string; releaseDate?: string; publishStatus: string; streamingLinks?: Partial<Record<Platform, string>> }
type Catalog = { releases: Release[]; artists: Array<{id: string; name: string}>; tracks: Array<{id: string; releaseId: string; title: string; audioUrl: string; trackNumber: number}> }
const platformLinkLabel = (name: string, href: string) =>
  /^\/(?:[a-z]{2}\/)?artists?\//i.test(new URL(href).pathname) ? `Artist on ${name}` : `Listen on ${name}`
export default function PublicMusicRelease({ id }: { id: string }) {
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let cancelled = false
    setCatalog(null); setError('')
    db.select<{value: {music: Catalog}}>('cms_settings', 'select=value&key=eq.cms&limit=1').then(rows => { if (!cancelled) setCatalog(rows[0]?.value?.music ?? {releases: [], artists: [], tracks: []}) }).catch(() => { if (!cancelled) setError('This release could not be loaded. Please try again.') })
    return () => { cancelled = true }
  }, [id])
  const release = catalog?.releases?.find(item => item.id === id && ['live','scheduled'].includes(item.publishStatus))
  useEffect(() => { document.title = release ? `${release.title} · Listen on EBG+` : 'Listen on EBG+' }, [release?.title])
  if (error || !catalog || !release) return <main className="public-release"><h1>{error || (!catalog ? 'Loading release…' : 'This release is not available.')}</h1><a href="https://ebgplus.app/app/music">Explore EBG+ Music</a></main>
  const artist = catalog.artists?.find(item => item.id === release.artistId)?.name ?? 'Artist'
  const live = release.publishStatus === 'live' || (release.publishStatus === 'scheduled' && !!release.releaseDate && Date.parse(release.releaseDate) <= Date.now())
  const tracks = live ? (catalog.tracks ?? []).filter(track => track.releaseId === id).sort((a,b) => a.trackNumber - b.trackNumber) : []
  const links: Partial<Record<Platform, string>> = {}
  for (const platform of platforms) { try { Object.assign(links, cleanPlatformLinks({ [platform.id]: release.streamingLinks?.[platform.id] })) } catch { /* Hide invalid catalog links. */ } }
  return <main className="public-release"><a className="public-release-brand" href="https://ebgplus.app">EBG+</a>{release.cover && <img className="public-release-cover" src={release.cover} alt={`${release.title} cover`} />}<p>{artist}</p><h1>{release.title}</h1><p>{live ? 'Listen on EBG+.' : `Coming ${release.releaseDate || 'soon'}`}</p>
    {live && <section aria-label="Listen on EBG+"><h2>Stream on EBG+</h2>{tracks.map(track => <article key={track.id}><strong>{track.trackNumber}. {track.title}</strong><audio controls preload="none" src={track.audioUrl} aria-label={track.title} /></article>)}{!tracks.length && <p>Audio is coming soon.</p>}</section>}
    <div className="public-release-platforms"><a href="https://ebgplus.app/app/music">{live ? 'Open EBG+ Music' : 'Explore EBG+ Music'} ↗</a>{platforms.filter(platform => links[platform.id]).map(platform => <a key={platform.id} href={links[platform.id]} target="_blank" rel="noopener noreferrer">{platformLinkLabel(platform.name, links[platform.id]!)} ↗</a>)}</div><small>External distribution through Studio is coming soon.</small></main>
}
