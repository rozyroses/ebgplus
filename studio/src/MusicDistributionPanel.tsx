import { useState } from 'react'
import { cleanPlatformLinks, distributionMissing, emptyDistribution, platforms, releaseLink } from './musicDistribution'
import type { DistributionDetails, Platform } from './musicDistribution'

type Release = { id: string; title: string; cover: string; genre: string; releaseDate: string; publishStatus: string; distribution?: DistributionDetails; streamingLinks?: Partial<Record<Platform, string>> }
export default function MusicDistributionPanel({ projectId, release, tracks, onSave }: { projectId: string; release: Release; tracks: Array<{ audioUrl: string; losslessUrl?: string }>; onSave: (patch: { distribution: DistributionDetails; streamingLinks: Partial<Record<Platform, string>> }) => Promise<boolean> }) {
  const [details, setDetails] = useState(() => ({ ...emptyDistribution(), ...release.distribution }))
  const [links, setLinks] = useState(release.streamingLinks ?? {})
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const missing = distributionMissing(release, tracks, details)
  const url = releaseLink(projectId, release.id)
  const save = async () => {
    setBusy(true)
    try {
      const cleaned = cleanPlatformLinks(links)
      if (await onSave({ distribution: details, streamingLinks: cleaned })) setMessage('Release details and listening links saved.')
      else setMessage('Could not save. Check the Studio message and try again.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not save release details.') }
    finally { setBusy(false) }
  }
  return <section className="music-distribution">
    <p className="eyebrow">DISTRIBUTION & LISTENING LINK</p><h4>One release. Every destination.</h4>
    <div className="distribution-status"><strong>EBG+: {release.publishStatus === 'live' ? 'Published' : release.publishStatus}</strong><strong>Streaming delivery: partner connection required</strong></div>
    <p>Prepare your release here. Streaming submission will become available when EBG+ connects a distribution partner. Saving these details does not deliver audio to streaming services.</p>
    <div className="music-v2-step-grid">
      {([['label','Label'],['copyright','Copyright (©)'],['recordingRights','Recording rights (℗)'],['upc','UPC (if assigned)'],['territories','Territories']] as const).map(([key, label]) => <label key={key}>{label}<input value={details[key]} onChange={event => setDetails({ ...details, [key]: event.target.value })} /></label>)}
      <label>Songwriter / producer credits<textarea value={details.credits} onChange={event => setDetails({ ...details, credits: event.target.value })} /></label>
    </div>
    <label className="music-check"><input type="checkbox" checked={details.rightsConfirmed} onChange={event => setDetails({ ...details, rightsConfirmed: event.target.checked })} /> I have the rights and permissions to distribute this release.</label>
    <p>{missing.length ? `Still needed: ${missing.join(' · ')}` : 'Basic release details are ready. Partner-specific validation will happen before delivery.'}</p>
    <h4>Your listening page</h4>{release.cover && <img className="distribution-release-cover" src={release.cover} alt={`${release.title} cover`} />}<p>Your listening page uses this release’s saved cover automatically. No second artwork upload is needed.</p><p>Live releases have an EBG+ player. Scheduled releases show a coming-soon page. Add direct streaming links when each platform makes your release available.</p>
    <div className="music-v2-step-grid">{platforms.map(platform => <label key={platform.id}>{platform.name}<input type="url" placeholder={`https://${platform.host}/…`} value={links[platform.id] ?? ''} onChange={event => setLinks({ ...links, [platform.id]: event.target.value })} /></label>)}</div>
    <div className="music-v2-step-actions"><button type="button" className="button" disabled={busy} onClick={() => void save()}>{busy ? 'Saving…' : 'Save distribution details & links'}</button>{['live','scheduled'].includes(release.publishStatus) && <><a className="button secondary" href={url} target="_blank" rel="noreferrer">Open listening page ↗</a><button type="button" className="button secondary" onClick={async () => { try { await navigator.clipboard.writeText(url); setMessage('Listening link copied.') } catch { setMessage(url) } }}>Copy release link</button></>}</div>
    {!['live','scheduled'].includes(release.publishStatus) && <p>Publish or schedule this release to make its listening page available.</p>}
    {message && <p role="status">{message}</p>}
  </section>
}
