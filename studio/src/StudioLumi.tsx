import { FormEvent, useEffect, useMemo, useState } from 'react'
import { readStoredSession } from '../../src/lib/auth'
import {
  deleteLumiPublication,
  listLumiPublications,
  loadProjectCms,
  publishLumiContent,
  updateLumiPublication,
  type LumiPublication,
  type LumiPublicationKind,
} from '../../src/lib/studioData'

type CmsSlice = {
  shows?: Array<{ id: string; title: string; description?: string; genre?: string; status?: string; cast?: Array<{ name: string; role: string }> }>
  episodes?: Array<{ id: string; showId: string; season: number; number: number; title: string; synopsis?: string; releaseDate?: string; publishStatus?: string }>
}

type LumiMessage = { role: 'user' | 'lumi'; text: string }
type PublishDraft = {
  kind: LumiPublicationKind
  title: string
  body: string
  link: string
  editingId?: string
}

const isLumiTab = () => window.location.hash.replace(/^#\/?/, '') === 'lumi'
const endpoint = import.meta.env.VITE_STUDIO_LUMI_URL || ''
const readProjectId = () => localStorage.getItem('ebg.studio.project.v1') ?? ''

const quickPrompts = [
  'Summarize this production',
  'Give me 5 episode ideas',
  'Draft a site news update',
  'Draft promo copy',
  'Create a fan poll',
  'Check episode continuity',
]

const getGreetingName = () => {
  const email = readStoredSession()?.user?.email?.trim() || ''
  const local = email.split('@')[0] || 'there'
  const readable = local.replace(/[._-]+/g, ' ').trim()
  return readable ? readable.replace(/\b\w/g, (letter) => letter.toUpperCase()) : 'there'
}

const cleanMarkdownLine = (line: string) => line
  .replace(/^#{1,6}\s*/, '')
  .replace(/^[-*•]\s+/, '')
  .replace(/\*\*/g, '')
  .replace(/^["']|["']$/g, '')
  .trim()

const preparePublicationDraft = (text: string, fallback: string) => {
  const raw = text
    .replace(/```(?:markdown|text)?/gi, '')
    .replace(/```/g, '')
    .trim()

  let lines = raw.split('\n').map((line) => line.trim())
  while (lines.length && !lines[0]) lines.shift()

  // Remove assistant chatter that should never become public copy.
  const chatter = /^(sure|absolutely|of course|here(?:'|’)s|here is|i(?:'|’)d|below is|you can|feel free|let me know|this (?:draft|post)|for (?:the )?post)[,!:\s-]/i
  while (lines.length && chatter.test(lines[0])) lines.shift()

  const explicitTitleIndex = lines.findIndex((line) => /^(?:headline|title)\s*[:\-]/i.test(cleanMarkdownLine(line)))
  const explicitBodyIndex = lines.findIndex((line) => /^(?:body|copy|post|article|message)\s*[:\-]?\s*$/i.test(cleanMarkdownLine(line)))

  let title = fallback
  let titleIndex = -1

  if (explicitTitleIndex >= 0) {
    titleIndex = explicitTitleIndex
    title = cleanMarkdownLine(lines[explicitTitleIndex]).replace(/^(?:headline|title)\s*[:\-]\s*/i, '').trim() || fallback
  } else {
    titleIndex = lines.findIndex(Boolean)
    if (titleIndex >= 0) title = cleanMarkdownLine(lines[titleIndex]) || fallback
  }

  let bodyLines = explicitBodyIndex >= 0 ? lines.slice(explicitBodyIndex + 1) : lines.filter((_, index) => index !== titleIndex)
  bodyLines = bodyLines
    .map(cleanMarkdownLine)
    .filter((line, index, all) => {
      if (!line) return index > 0 && index < all.length - 1
      if (/^(?:headline|title|body|copy|post|article|message)\s*[:\-]?\s*$/i.test(line)) return false
      if (/^(?:hope this helps|let me know|want me to|would you like|you can tweak|feel free to)/i.test(line)) return false
      return true
    })

  let body = bodyLines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
  if (!body) body = raw

  title = title.replace(/^(?:headline|title)\s*[:\-]\s*/i, '').trim()
  if (title.length > 100) title = title.slice(0, 97).trimEnd() + '…'

  return { title, body }
}

export default function StudioLumi() {
  const [active, setActive] = useState(isLumiTab)
  const [projectId, setProjectId] = useState(readProjectId)
  const [cms, setCms] = useState<CmsSlice>({ shows: [], episodes: [] })
  const [showId, setShowId] = useState('')
  const [messages, setMessages] = useState<LumiMessage[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [publishDraft, setPublishDraft] = useState<PublishDraft | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [publishMessage, setPublishMessage] = useState('')
  const [publications, setPublications] = useState<LumiPublication[]>([])
  const [managingId, setManagingId] = useState('')
  const greetingName = useMemo(getGreetingName, [active])

  const refreshProject = async (nextProjectId = projectId) => {
    if (!nextProjectId) {
      setCms({ shows: [], episodes: [] })
      setShowId('')
      setError('Choose or create a Studio project first.')
      return
    }

    setError('')
    try {
      const [next, published] = await Promise.all([
        loadProjectCms<CmsSlice>(nextProjectId),
        listLumiPublications(nextProjectId),
      ])
      const projectCms = next ?? { shows: [], episodes: [] }
      setCms(projectCms)
      setPublications(published ?? [])
      setShowId((current) => projectCms.shows?.some((show) => show.id === current) ? current : projectCms.shows?.[0]?.id ?? '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lumi could not load this Studio project.')
    }
  }

  useEffect(() => {
    const sync = () => setActive(isLumiTab())
    const syncProject = (event: Event) => {
      const custom = event as CustomEvent<{ projectId?: string }>
      const next = custom.detail?.projectId ?? readProjectId()
      setProjectId(next)
      setMessages([])
      setPublishDraft(null)
      setPublishMessage('')
      void refreshProject(next)
    }

    window.addEventListener('hashchange', sync)
    window.addEventListener('ebg-studio-project-change', syncProject)
    return () => {
      window.removeEventListener('hashchange', sync)
      window.removeEventListener('ebg-studio-project-change', syncProject)
    }
  }, [])

  useEffect(() => {
    if (active) void refreshProject(projectId)
  }, [active, projectId])

  useEffect(() => {
    let button: HTMLButtonElement | null = null

    const syncActive = () => button?.classList.toggle('active', isLumiTab())
    const mountLumiNav = () => {
      const nav = document.querySelector('.sidebar nav')
      if (!nav) return false
      const existing = nav.querySelector<HTMLButtonElement>('[data-studio-lumi-nav]')
      if (existing) {
        button = existing
        syncActive()
        return true
      }

      button = document.createElement('button')
      button.type = 'button'
      button.dataset.studioLumiNav = 'true'
      button.innerHTML = '<span>✦</span>Lumi'
      button.addEventListener('click', () => { window.location.hash = 'lumi' })
      nav.appendChild(button)
      syncActive()
      return true
    }

    const observer = new MutationObserver(() => {
      if (mountLumiNav()) observer.disconnect()
    })

    if (!mountLumiNav()) observer.observe(document.documentElement, { childList: true, subtree: true })
    window.addEventListener('hashchange', syncActive)

    return () => {
      observer.disconnect()
      window.removeEventListener('hashchange', syncActive)
      button?.remove()
    }
  }, [])

  useEffect(() => {
    const onChange = (event: Event) => {
      const target = event.target
      if (!(target instanceof HTMLSelectElement) || !target.matches('.studio-v3-production select')) return
      if (cms.shows?.some((show) => show.id === target.value)) setShowId(target.value)
    }
    document.addEventListener('change', onChange, true)
    return () => document.removeEventListener('change', onChange, true)
  }, [cms.shows])

  const selectedShow = useMemo(() => cms.shows?.find((show) => show.id === showId) ?? null, [cms.shows, showId])
  const selectedEpisodes = useMemo(() => cms.episodes?.filter((episode) => episode.showId === showId) ?? [], [cms.episodes, showId])
  const hasConversation = messages.length > 0 || busy

  const fillPrompt = (prompt: string) => {
    const input = document.querySelector<HTMLInputElement>('#studio-lumi-input')
    if (!input) return
    input.value = prompt
    input.focus()
  }

  const openPublish = (text: string) => {
    setPublishMessage('')
    const prepared = preparePublicationDraft(text, selectedShow ? `${selectedShow.title} Update` : 'EBG+ Update')
    setPublishDraft({
      kind: 'news',
      title: prepared.title,
      body: prepared.body,
      link: selectedShow ? `/app/shows/${selectedShow.id}` : '',
    })
  }

  const editPublication = (item: LumiPublication) => {
    setPublishMessage('')
    setPublishDraft({
      kind: item.kind,
      title: item.kind === 'news' ? (item.headline || item.title || '') : (item.title || ''),
      body: item.kind === 'news' ? (item.body || item.summary || '') : (item.text || item.body || ''),
      link: item.link || '',
      editingId: item.id,
    })
  }

  const removePublication = async (item: LumiPublication) => {
    if (!projectId || managingId || !window.confirm(`Delete this ${item.kind === 'news' ? 'news post' : 'notification'} from EBG+?`)) return
    setManagingId(item.id)
    setError('')
    try {
      await deleteLumiPublication({ projectId, kind: item.kind, id: item.id })
      setPublications((current) => current.filter((entry) => entry.id !== item.id))
      setPublishMessage(item.kind === 'news' ? 'News post deleted.' : 'Notification deleted.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete this publication.')
    } finally {
      setManagingId('')
    }
  }

  const publish = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!publishDraft || !projectId || publishing) return
    setPublishing(true)
    setError('')
    setPublishMessage('')
    try {
      const result = publishDraft.editingId
        ? await updateLumiPublication({
            projectId,
            kind: publishDraft.kind,
            id: publishDraft.editingId,
            title: publishDraft.title,
            body: publishDraft.body,
            link: publishDraft.kind === 'notification' ? publishDraft.link : undefined,
          })
        : await publishLumiContent({
            projectId,
            kind: publishDraft.kind,
            title: publishDraft.title,
            body: publishDraft.body,
            link: publishDraft.kind === 'notification' ? publishDraft.link : undefined,
          })
      setPublishMessage(publishDraft.editingId
        ? (result.kind === 'news' ? 'News post updated.' : 'Notification updated.')
        : (result.kind === 'news' ? 'Published to EBG+ News.' : 'Notification published to EBG+.'))
      setPublishDraft(null)
      setPublications(await listLumiPublications(projectId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lumi could not publish this update.')
    } finally {
      setPublishing(false)
    }
  }

  const send = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy || !showId || !projectId) return
    const form = new FormData(event.currentTarget)
    const text = String(form.get('message') ?? '').trim()
    if (!text) return
    if (!endpoint) {
      setError('Studio Lumi is ready in the app, but VITE_STUDIO_LUMI_URL still needs the Cloudflare Worker URL.')
      return
    }

    const session = readStoredSession()
    if (!session) return

    const nextMessages = [...messages, { role: 'user' as const, text }]
    setMessages(nextMessages)
    event.currentTarget.reset()
    setBusy(true)
    setError('')
    setPublishMessage('')

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          projectId,
          showId,
          messages: nextMessages.slice(-12).map((message) => ({
            role: message.role === 'lumi' ? 'assistant' : 'user',
            content: message.text,
          })),
        }),
      })

      const payload = await response.json().catch(() => ({})) as { reply?: string; error?: string }
      if (!response.ok) throw new Error(payload.error || `Lumi request failed (${response.status}).`)
      setMessages((current) => [...current, { role: 'lumi', text: payload.reply || 'I’m here — try that again.' }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lumi could not answer right now.')
    } finally {
      setBusy(false)
    }
  }

  if (!active) return null

  return (
    <section className="studio-lumi-overlay" aria-label="Lumi for EBG Studio">
      <div className={`studio-lumi-shell ${hasConversation ? 'conversation-active' : ''}`}>
        <header className="studio-lumi-topbar">
          <div className="studio-lumi-brand">
            <span className="lumi-orb">✦</span>
            <div><strong>Lumi</strong><small>EBG Studio AI</small></div>
          </div>

          <div className="studio-lumi-production-picker">
            <span>Production</span>
            <select value={showId} onChange={(event) => setShowId(event.target.value)}>
              {(cms.shows ?? []).map((show) => <option value={show.id} key={show.id}>{show.title}</option>)}
            </select>
          </div>

          <span className="lumi-safe-pill">review before publish</span>
        </header>

        {!hasConversation && (
          <main className="studio-lumi-welcome">
            <div className="lumi-ambient-glow" aria-hidden="true" />
            <div className="lumi-welcome-copy">
              <span className="lumi-kicker">LUMI ✦ STUDIO</span>
              <h1>Let’s jump in, <span className="lumi-greeting-name">{greetingName}.</span></h1>
              <p>Lumi’s ready to brainstorm, write, and prepare updates you can review and publish to EBG+.</p>
            </div>

            <form className="studio-lumi-composer hero-composer" onSubmit={send}>
              <span className="composer-spark" aria-hidden="true">✦</span>
              <input id="studio-lumi-input" name="message" placeholder={selectedShow ? `Ask Lumi about ${selectedShow.title}` : 'Choose a production first'} autoComplete="off" disabled={!showId || busy} />
              <button className="lumi-send-button" type="submit" disabled={!showId || busy} aria-label="Send to Lumi">➜</button>
            </form>

            <div className="lumi-quick-prompts">
              {quickPrompts.map((prompt) => <button type="button" key={prompt} onClick={() => fillPrompt(prompt)}>{prompt}</button>)}
            </div>

            {selectedShow && (
              <div className="lumi-production-strip">
                <div><span>{selectedShow.genre || 'Series'} · {selectedShow.status || 'Production'}</span><strong>{selectedShow.title}</strong></div>
                <p>{selectedShow.description || 'No description yet.'}</p>
                <small>{selectedEpisodes.length} episode{selectedEpisodes.length === 1 ? '' : 's'} in this private project</small>
              </div>
            )}

            {publishMessage && <div className="studio-lumi-success">{publishMessage} <a href="https://ebgplus.app" target="_blank" rel="noreferrer">View site ↗</a></div>}
            {error && <div className="studio-lumi-error welcome-error">{error}</div>}

            {publications.length > 0 && (
              <section className="lumi-publications">
                <div className="lumi-publications-head"><div><span>PUBLISHED BY LUMI</span><h2>Live on EBG+</h2></div><small>{publications.length} item{publications.length === 1 ? '' : 's'}</small></div>
                <div className="lumi-publication-list">
                  {publications.map((item) => (
                    <article key={item.id}>
                      <div><span>{item.kind === 'news' ? 'NEWS' : 'NOTIFICATION'}</span><strong>{item.kind === 'news' ? item.headline : item.title}</strong><p>{item.kind === 'news' ? (item.summary || item.body) : item.text}</p></div>
                      <div className="lumi-publication-actions"><button type="button" onClick={() => editPublication(item)}>Edit</button><button className="danger" type="button" disabled={managingId === item.id} onClick={() => void removePublication(item)}>{managingId === item.id ? 'Deleting…' : 'Delete'}</button></div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            <small className="lumi-readonly-note">Lumi can publish News and viewer notifications only after you review and approve the draft.</small>
          </main>
        )}

        {hasConversation && (
          <main className="studio-lumi-chat">
            <div className="studio-lumi-chat-context">
              <span className="lumi-spark">✦</span>
              <div>
                <strong>{selectedShow?.title || 'Lumi Studio'}</strong>
                <small>{selectedShow ? `${selectedShow.genre || 'Series'} · ${selectedEpisodes.length} episode${selectedEpisodes.length === 1 ? '' : 's'}` : 'Production context'}</small>
              </div>
            </div>

            <div className="studio-lumi-messages">
              {messages.map((message, index) => (
                <article className={message.role} key={`${message.role}-${index}`}>
                  <span>{message.role === 'lumi' ? 'Lumi ✦' : 'You'}</span>
                  <p>{message.text}</p>
                  {message.role === 'lumi' && (
                    <div className="lumi-message-actions">
                      <button type="button" onClick={() => openPublish(message.text)}>↗ Review & Publish</button>
                    </div>
                  )}
                </article>
              ))}
              {busy && <article className="lumi thinking"><span>Lumi ✦</span><p>thinking with your production context…</p></article>}
            </div>

            {publishMessage && <div className="studio-lumi-success">{publishMessage} <a href="https://ebgplus.app" target="_blank" rel="noreferrer">View site ↗</a></div>}
            {error && <div className="studio-lumi-error">{error}</div>}

            <div className="lumi-conversation-footer">
              <div className="lumi-quick-prompts compact">
                {quickPrompts.slice(0, 4).map((prompt) => <button type="button" key={prompt} onClick={() => fillPrompt(prompt)}>{prompt}</button>)}
              </div>
              <form className="studio-lumi-composer" onSubmit={send}>
                <span className="composer-spark" aria-hidden="true">✦</span>
                <input id="studio-lumi-input" name="message" placeholder={selectedShow ? `Ask Lumi about ${selectedShow.title}` : 'No production selected'} autoComplete="off" disabled={!showId || busy} />
                <button className="lumi-send-button" type="submit" disabled={!showId || busy} aria-label="Send to Lumi">{busy ? '…' : '➜'}</button>
              </form>
              <small className="lumi-readonly-note">Lumi only sees the selected private project. Publishing always requires your review.</small>
            </div>
          </main>
        )}

        {publishDraft && (
          <div className="lumi-publish-backdrop" role="presentation" onMouseDown={(event) => {
            if (event.currentTarget === event.target && !publishing) setPublishDraft(null)
          }}>
            <form className="lumi-publish-sheet" onSubmit={publish}>
              <header>
                <div><span>LUMI ✦ {publishDraft.editingId ? 'EDIT' : 'PUBLISH'}</span><h2>{publishDraft.editingId ? 'Edit live content.' : 'Review before it goes live.'}</h2><p>{publishDraft.editingId ? 'Save your changes or close without changing the live post.' : 'Only the clean public copy below will be published — not Lumi’s instructions or chat.'}</p></div>
                <button type="button" disabled={publishing} onClick={() => setPublishDraft(null)} aria-label="Close publish review">×</button>
              </header>

              <div className="lumi-publish-destination">
                <button type="button" className={publishDraft.kind === 'news' ? 'active' : ''} onClick={() => setPublishDraft({ ...publishDraft, kind: 'news' })}><strong>News</strong><small>Publish an article to EBG+ News.</small></button>
                <button type="button" className={publishDraft.kind === 'notification' ? 'active' : ''} onClick={() => setPublishDraft({ ...publishDraft, kind: 'notification' })}><strong>Notification</strong><small>Send an update to EBG+ viewers.</small></button>
              </div>

              <label>Title<input value={publishDraft.title} maxLength={120} required onChange={(event) => setPublishDraft({ ...publishDraft, title: event.target.value })} /></label>
              <label>Body<textarea value={publishDraft.body} required rows={10} onChange={(event) => setPublishDraft({ ...publishDraft, body: event.target.value })} /></label>
              {publishDraft.kind === 'notification' && <label>Optional link<input value={publishDraft.link} placeholder="/app/shows/..." onChange={(event) => setPublishDraft({ ...publishDraft, link: event.target.value })} /></label>}

              <footer>
                <button className="button secondary" type="button" disabled={publishing} onClick={() => setPublishDraft(null)}>Keep Editing in Lumi</button>
                <button className="button" type="submit" disabled={publishing || !publishDraft.title.trim() || !publishDraft.body.trim()}>{publishing ? (publishDraft.editingId ? 'Saving…' : 'Publishing…') : (publishDraft.editingId ? 'Save Changes' : 'Publish to EBG+')}</button>
              </footer>
            </form>
          </div>
        )}
      </div>
    </section>
  )
}
