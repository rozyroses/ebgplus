import { FormEvent, useEffect, useMemo, useState } from 'react'
import { readStoredSession } from '../../src/lib/auth'
import { db } from '../../src/lib/supabase'

type CmsSlice = {
  shows?: Array<{ id: string; title: string; description?: string; genre?: string; status?: string; cast?: Array<{ name: string; role: string }> }>
  episodes?: Array<{ id: string; showId: string; season: number; number: number; title: string; synopsis?: string; releaseDate?: string; publishStatus?: string }>
}

type LumiMessage = { role: 'user' | 'lumi'; text: string }

const isLumiTab = () => window.location.hash.replace(/^#\/?/, '') === 'lumi'
const endpoint = import.meta.env.VITE_STUDIO_LUMI_URL || ''
const quickPrompts = [
  'Summarize this production',
  'Give me 5 episode ideas',
  'Draft promo copy',
  'Create a fan poll',
  'Check episode continuity',
]

export default function StudioLumi() {
  const [active, setActive] = useState(isLumiTab)
  const [cms, setCms] = useState<CmsSlice>({ shows: [], episodes: [] })
  const [showId, setShowId] = useState('')
  const [messages, setMessages] = useState<LumiMessage[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const sync = () => setActive(isLumiTab())
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

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

    if (!mountLumiNav()) {
      observer.observe(document.documentElement, { childList: true, subtree: true })
    }

    window.addEventListener('hashchange', syncActive)
    return () => {
      observer.disconnect()
      window.removeEventListener('hashchange', syncActive)
      button?.remove()
    }
  }, [])

  useEffect(() => {
    if (!active) return
    const session = readStoredSession()
    if (!session) return
    setError('')
    void db.rpc<CmsSlice | null>('studio_load_cms', {}, session.access_token)
      .then((value) => {
        const next = value ?? { shows: [], episodes: [] }
        setCms(next)
        const topSelect = document.querySelector<HTMLSelectElement>('.top-actions select')
        const topValue = topSelect?.value
        const allowed = next.shows?.some((show) => show.id === topValue)
        setShowId(allowed ? String(topValue) : next.shows?.[0]?.id ?? '')
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Lumi could not load your Studio access.'))
  }, [active])

  useEffect(() => {
    const onChange = (event: Event) => {
      const target = event.target
      if (!(target instanceof HTMLSelectElement) || !target.matches('.top-actions select')) return
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

  const send = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy || !showId) return
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
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          showId,
          messages: nextMessages.slice(-12).map((message) => ({ role: message.role === 'lumi' ? 'assistant' : 'user', content: message.text })),
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
            <div>
              <strong>Lumi</strong>
              <small>EBG Studio AI</small>
            </div>
          </div>

          <div className="studio-lumi-production-picker">
            <span>Production</span>
            <select value={showId} onChange={(event) => setShowId(event.target.value)}>
              {(cms.shows ?? []).map((show) => <option value={show.id} key={show.id}>{show.title}</option>)}
            </select>
          </div>

          <span className="lumi-safe-pill">permission scoped</span>
        </header>

        {!hasConversation && (
          <main className="studio-lumi-welcome">
            <div className="lumi-ambient-glow" aria-hidden="true" />
            <div className="lumi-welcome-copy">
              <span className="lumi-kicker">LUMI ✦ STUDIO</span>
              <h1>What are we creating today?</h1>
              <p>{selectedShow ? `I’m locked into ${selectedShow.title}. Let’s build, polish, plan, or rethink anything around this production.` : 'Choose a production and we can start creating.'}</p>
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
                <div>
                  <span>{selectedShow.genre || 'Series'} · {selectedShow.status || 'Production'}</span>
                  <strong>{selectedShow.title}</strong>
                </div>
                <p>{selectedShow.description || 'No description yet.'}</p>
                <small>{selectedEpisodes.length} episode{selectedEpisodes.length === 1 ? '' : 's'} available in your Studio access</small>
              </div>
            )}

            {error && <div className="studio-lumi-error welcome-error">{error}</div>}
            <small className="lumi-readonly-note">Suggestion-only v1 · Lumi cannot publish or edit EBG+ yet.</small>
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
                </article>
              ))}
              {busy && <article className="lumi thinking"><span>Lumi ✦</span><p>thinking with your production context…</p></article>}
            </div>

            {error && <div className="studio-lumi-error">{error}</div>}

            <div className="lumi-conversation-footer">
              <div className="lumi-quick-prompts compact">
                {quickPrompts.slice(0, 3).map((prompt) => <button type="button" key={prompt} onClick={() => fillPrompt(prompt)}>{prompt}</button>)}
              </div>
              <form className="studio-lumi-composer" onSubmit={send}>
                <span className="composer-spark" aria-hidden="true">✦</span>
                <input id="studio-lumi-input" name="message" placeholder={selectedShow ? `Ask Lumi about ${selectedShow.title}` : 'No accessible production selected'} autoComplete="off" disabled={!showId || busy} />
                <button className="lumi-send-button" type="submit" disabled={!showId || busy} aria-label="Send to Lumi">{busy ? '…' : '➜'}</button>
              </form>
              <small className="lumi-readonly-note">Lumi only receives production data this signed-in account can access.</small>
            </div>
          </main>
        )}
      </div>
    </section>
  )
}
