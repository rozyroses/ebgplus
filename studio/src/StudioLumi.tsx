import { FormEvent, useEffect, useMemo, useState } from 'react'
import { loadAuthState, readStoredSession } from '../../src/lib/auth'
import {
  createLumiChat,
  deleteLumiChat,
  deleteLumiPublication,
  generateLumiImage,
  listLumiChats,
  listLumiPublications,
  loadMyStudioProjects,
  loadProjectCms,
  publishLumiContent,
  publishLumiMusicRelease,
  renameLumiChat,
  saveLumiChat,
  updateLumiPublication,
  uploadStudioProjectMedia,
  type LumiChat,
  type LumiImageAspect,
  type LumiImageKind,
  type LumiPublication,
  type LumiPublicationKind,
  type StudioProject,
} from '../../src/lib/studioData'

type CmsSlice = {
  shows?: Array<{ id: string; title: string; description?: string; genre?: string; status?: string; cast?: Array<{ name: string; role: string }> }>
  episodes?: Array<{ id: string; showId: string; season: number; number: number; title: string; synopsis?: string; releaseDate?: string; publishStatus?: string }>
  music?: {
    artists?: Array<{ id: string; name: string }>
    releases?: Array<{ id: string; title: string; publishStatus?: string; releaseDate?: string }>
    tracks?: Array<{ id: string; title: string; timedLyrics?: Array<{ start: number; end: number; text: string }> }>
    videos?: Array<{ id: string; title: string }>
  }
}

type LumiMessage = { role: 'user' | 'lumi'; text: string; imageUrl?: string; imagePrompt?: string }
type LumiMode = 'chat' | 'create' | 'run'
type PublishDraft = {
  kind: LumiPublicationKind | 'music'
  title: string
  body: string
  link: string
  editingId?: string
}

type MusicDetails = {
  artistName: string
  title: string
  releaseType: 'single' | 'ep' | 'album'
  genre: string
  releaseDate: string
  publishStatus: 'draft' | 'scheduled' | 'live'
  explicit: boolean
  coverUrl: string
}

const emptyMusicDetails = (): MusicDetails => ({
  artistName: '',
  title: '',
  releaseType: 'single',
  genre: '',
  releaseDate: new Date().toISOString().slice(0, 10),
  publishStatus: 'draft',
  explicit: false,
  coverUrl: '',
})

const isLumiTab = () => window.location.hash.replace(/^#\/?/, '') === 'lumi'
const endpoint = import.meta.env.VITE_STUDIO_LUMI_URL || ''
const readProjectId = () => localStorage.getItem('ebg.studio.project.v1') ?? ''

const modePrompts: Record<LumiMode, string[]> = {
  chat: [
    'Summarize this production',
    'What should I work on next?',
    'Check episode continuity',
    'Give me 5 ideas',
  ],
  create: [
    'Generate an image',
    'Draft a site news update',
    'Write promo copy',
    'Prepare a music release',
  ],
  run: [
    'Generate an image',
    'Publish an update',
    'Prepare a music release for EBG+',
    'Generate timed lyrics for a track',
  ],
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
  const [projectMeta, setProjectMeta] = useState<Pick<StudioProject, 'id' | 'title' | 'project_kind'> | null>(null)
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
  const [chats, setChats] = useState<LumiChat[]>([])
  const [activeChatId, setActiveChatId] = useState('')
  const [historyOpen, setHistoryOpen] = useState(false)
  const [profileName, setProfileName] = useState('there')
  const [musicDetails, setMusicDetails] = useState<MusicDetails>(emptyMusicDetails)
  const [musicInfoOpen, setMusicInfoOpen] = useState(false)
  const [musicCoverFile, setMusicCoverFile] = useState<File | null>(null)
  const [mode, setMode] = useState<LumiMode>('chat')
  const [imageOpen, setImageOpen] = useState(false)
  const [imagePrompt, setImagePrompt] = useState('')
  const [imageKind, setImageKind] = useState<LumiImageKind>('custom')
  const [imageAspect, setImageAspect] = useState<LumiImageAspect>('square')
  const [imageGenerating, setImageGenerating] = useState(false)
  const greetingName = useMemo(() => profileName || 'there', [profileName])

  const refreshProject = async (nextProjectId = projectId) => {
    if (!nextProjectId) {
      setCms({ shows: [], episodes: [] })
      setShowId('')
      setError('Choose or create a Studio project first.')
      return
    }

    setError('')
    try {
      const [next, published, chatHistory, projectList] = await Promise.all([
        loadProjectCms<CmsSlice>(nextProjectId),
        listLumiPublications(nextProjectId),
        listLumiChats(nextProjectId),
        loadMyStudioProjects<CmsSlice>(),
      ])
      const projectCms = next ?? { shows: [], episodes: [] }
      const nextChats = chatHistory ?? []
      const currentProject = projectList.find((project) => project.id === nextProjectId) ?? null
      setProjectMeta(currentProject ? { id: currentProject.id, title: currentProject.title, project_kind: currentProject.project_kind } : null)
      setCms(projectCms)
      setPublications(published ?? [])
      setChats(nextChats)
      const selectedChat = nextChats.find((chat) => chat.id === activeChatId) ?? nextChats[0] ?? null
      setActiveChatId(selectedChat?.id ?? '')
      setMessages(selectedChat?.messages ?? [])
      setShowId((current) => projectCms.shows?.some((show) => show.id === current) ? current : projectCms.shows?.[0]?.id ?? '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lumi could not load this Studio project.')
    }
  }

  useEffect(() => {
    const session = readStoredSession()
    if (!session) return
    void loadAuthState(session)
      .then((state) => {
        const name = state.studioIdentity?.display_name?.trim()
          || state.profiles?.[0]?.name?.trim()
          || session.user.email?.split('@')[0]
          || 'there'
        setProfileName(name)
      })
      .catch(() => {
        const fallback = session.user.email?.split('@')[0]?.replace(/[._-]+/g, ' ').trim()
        if (fallback) setProfileName(fallback.replace(/\b\w/g, (letter) => letter.toUpperCase()))
      })
  }, [active])

  useEffect(() => {
    const sync = () => setActive(isLumiTab())
    const syncProject = (event: Event) => {
      const custom = event as CustomEvent<{ projectId?: string }>
      const next = custom.detail?.projectId ?? readProjectId()
      setProjectId(next)
      setMessages([])
      setChats([])
      setActiveChatId('')
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
    if (!active) return
    const prefill = localStorage.getItem('ebg.lumi.prefill')
    if (!prefill) return
    localStorage.removeItem('ebg.lumi.prefill')
    setMode('create')
    window.setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>('#studio-lumi-input')
      if (input) {
        input.value = prefill
        input.focus()
      }
    }, 60)
  }, [active])


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
  const musicArtists = cms.music?.artists?.length ?? 0
  const musicReleases = cms.music?.releases?.length ?? 0
  const musicTracks = cms.music?.tracks?.length ?? 0
  const timedTracks = cms.music?.tracks?.filter((track) => Array.isArray(track.timedLyrics) && track.timedLyrics.length > 0).length ?? 0
  const hasConversation = messages.length > 0 || busy
  const quickPrompts = modePrompts[mode]

  const fillPrompt = (prompt: string) => {
    if (/^generate an image$/i.test(prompt.trim())) {
      setMode('create')
      setImageOpen(true)
      return
    }
    const input = document.querySelector<HTMLInputElement>('#studio-lumi-input')
    if (!input) return
    input.value = prompt
    input.focus()
  }

  const openImageGenerator = (prompt = '') => {
    setMode('create')
    setImagePrompt(prompt)
    setImageOpen(true)
    setError('')
  }

  const generateImage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!projectId || imageGenerating || !imagePrompt.trim()) return
    setImageGenerating(true)
    setError('')
    try {
      let chatId = activeChatId
      let workingChat = chats.find((chat) => chat.id === activeChatId) ?? null
      if (!chatId) {
        workingChat = await createLumiChat(projectId, `Image: ${imagePrompt.trim()}`)
        chatId = workingChat.id
        setActiveChatId(chatId)
        setChats((current) => [workingChat as LumiChat, ...current.filter((chat) => chat.id !== chatId)])
      }

      const userTurn: LumiMessage = { role: 'user', text: `Generate an image: ${imagePrompt.trim()}` }
      const beforeImage = [...messages, userTurn]
      setMessages(beforeImage)

      const result = await generateLumiImage({
        projectId,
        prompt: imagePrompt.trim(),
        kind: imageKind,
        aspect: imageAspect,
      })

      const imageTurn: LumiMessage = {
        role: 'lumi',
        text: 'Here’s the image I generated for you.',
        imageUrl: result.imageUrl,
        imagePrompt: result.prompt,
      }
      const completed = [...beforeImage, imageTurn]
      setMessages(completed)
      setImageOpen(false)

      const saved = await saveLumiChat(chatId, completed, workingChat?.messages?.length ? undefined : `Image: ${imagePrompt.trim()}`)
      setChats((current) => [saved, ...current.filter((chat) => chat.id !== saved.id)])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lumi could not generate that image.')
    } finally {
      setImageGenerating(false)
    }
  }

  const startNewChat = () => {
    if (busy) return
    setActiveChatId('')
    setMessages([])
    setError('')
    setPublishMessage('')
    setHistoryOpen(false)
    window.setTimeout(() => document.querySelector<HTMLInputElement>('#studio-lumi-input')?.focus(), 0)
  }

  const openChat = (chat: LumiChat) => {
    if (busy) return
    setActiveChatId(chat.id)
    setMessages(chat.messages ?? [])
    setError('')
    setPublishMessage('')
    setHistoryOpen(false)
  }

  const renameChat = async (chat: LumiChat) => {
    if (busy) return
    const nextTitle = window.prompt('Rename this Lumi chat', chat.title)
    if (!nextTitle?.trim()) return
    try {
      const updated = await renameLumiChat(chat.id, nextTitle)
      setChats((current) => current.map((entry) => entry.id === updated.id ? updated : entry))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lumi could not rename this chat.')
    }
  }

  const removeChat = async (chat: LumiChat) => {
    if (busy || !window.confirm(`Delete “${chat.title}”? This removes the full Lumi conversation.`)) return
    try {
      await deleteLumiChat(chat.id)
      const remaining = chats.filter((entry) => entry.id !== chat.id)
      setChats(remaining)
      if (activeChatId === chat.id) {
        const next = remaining[0] ?? null
        setActiveChatId(next?.id ?? '')
        setMessages(next?.messages ?? [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lumi could not delete this chat.')
    }
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

  const chooseMusicDestination = () => {
    if (!publishDraft) return
    setPublishDraft({ ...publishDraft, kind: 'music' })
    setMusicDetails((current) => ({
      ...current,
      title: current.title || publishDraft.title,
    }))
    setMusicInfoOpen(true)
  }

  const submitMusicDetails = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!projectId || publishing) return
    if (!musicDetails.artistName.trim() || !musicDetails.title.trim()) {
      setError('Lumi still needs an artist name and release title.')
      return
    }
    setPublishing(true)
    setError('')
    try {
      let coverUrl = musicDetails.coverUrl
      if (musicCoverFile) {
        coverUrl = await uploadStudioProjectMedia(musicCoverFile, projectId, 'music/covers')
      }
      setMusicDetails({ ...musicDetails, coverUrl })
      setPublishDraft((current) => current ? { ...current, kind: 'music', title: musicDetails.title } : current)
      setMusicCoverFile(null)
      setMusicInfoOpen(false)
      setPublishMessage('Got it — Lumi has the release details. Review them, then publish when ready.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lumi could not save those music details.')
    } finally {
      setPublishing(false)
    }
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
      if (publishDraft.kind === 'music') {
        if (!musicDetails.artistName.trim() || !musicDetails.title.trim()) {
          setPublishing(false)
          setMusicInfoOpen(true)
          return
        }
        const result = await publishLumiMusicRelease({
          projectId,
          artistName: musicDetails.artistName,
          title: musicDetails.title,
          releaseType: musicDetails.releaseType,
          genre: musicDetails.genre,
          cover: musicDetails.coverUrl,
          releaseDate: musicDetails.releaseDate,
          publishStatus: musicDetails.publishStatus,
          explicit: musicDetails.explicit,
        })
        setPublishMessage(result.publishStatus === 'live'
          ? 'Music release published live to EBG+ Music.'
          : result.publishStatus === 'scheduled'
            ? 'Music release scheduled for EBG+ Music.'
            : 'Music release saved as a draft in Music Studio.')
        setPublishDraft(null)
        setMusicDetails(emptyMusicDetails())
        return
      }

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
    if (busy || !projectId) return
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const text = String(form.get('message') ?? '').trim()
    if (!text) return

    const imageIntent = /\b(generate|make|create|design|render|draw)\b[\s\S]{0,48}\b(image|art|artwork|cover|cover art|poster|visual|graphic|portrait|photo|picture)\b/i.test(text)
      || /\b(cover art|album cover|single cover|promo poster|character visual|social graphic)\b/i.test(text)

    if (imageIntent) {
      const kind: LumiImageKind =
        /cover|album|single/i.test(text) ? 'cover-art'
        : /poster/i.test(text) ? 'promo-poster'
        : /character/i.test(text) ? 'character-visual'
        : /social|graphic/i.test(text) ? 'social-graphic'
        : 'custom'

      const aspect: LumiImageAspect =
        /portrait|vertical|9:16|4:5/i.test(text) ? 'portrait'
        : /landscape|wide|16:9/i.test(text) ? 'landscape'
        : 'square'

      setImageKind(kind)
      setImageAspect(aspect)
      setImagePrompt(text)
      setImageOpen(true)
      formElement.reset()
      return
    }
    if (!endpoint) {
      setError('Studio Lumi is ready in the app, but VITE_STUDIO_LUMI_URL still needs the Cloudflare Worker URL.')
      return
    }

    const session = readStoredSession()
    if (!session) return

    let chatId = activeChatId
    let workingChat = chats.find((chat) => chat.id === activeChatId) ?? null

    try {
      if (!chatId) {
        workingChat = await createLumiChat(projectId, text)
        chatId = workingChat.id
        setActiveChatId(chatId)
        setChats((current) => [workingChat as LumiChat, ...current.filter((chat) => chat.id !== chatId)])
      }

      const nextMessages = [...messages, { role: 'user' as const, text }]
      setMessages(nextMessages)
      formElement.reset()
      setBusy(true)
      setError('')
      setPublishMessage('')

      const savedUserTurn = await saveLumiChat(chatId, nextMessages, workingChat?.messages?.length ? undefined : text)
      setChats((current) => [savedUserTurn, ...current.filter((chat) => chat.id !== savedUserTurn.id)])

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
      const reply = payload.reply || 'I’m here — try that again.'
      const completedMessages = [...nextMessages, { role: 'lumi' as const, text: reply }]
      setMessages(completedMessages)
      const savedReply = await saveLumiChat(chatId, completedMessages)
      setChats((current) => [savedReply, ...current.filter((chat) => chat.id !== savedReply.id)])
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

          <div className="studio-lumi-project-chip">
            <span>WORKSPACE</span>
            <strong>{projectMeta?.title || 'EBG Studio'}</strong>
            <small>{projectMeta?.project_kind === 'music' ? 'Music' : projectMeta?.project_kind === 'mixed' ? 'Mixed' : 'Show / Series'}</small>
          </div>

          <nav className="lumi-v4-modes" aria-label="Lumi mode">
            {(['chat','create','run'] as LumiMode[]).map((item) => (
              <button type="button" key={item} className={mode === item ? 'active' : ''} onClick={() => setMode(item)}>
                {item === 'chat' ? 'Chat' : item === 'create' ? 'Create' : 'Run'}
              </button>
            ))}
          </nav>

          <div className="lumi-topbar-actions">
            <button className="lumi-new-chat-button" type="button" onClick={startNewChat}>＋ New Chat</button>
            <button className="lumi-history-toggle" type="button" onClick={() => setHistoryOpen((value) => !value)}>☰ History</button>
            <span className="lumi-v4-badge">V4</span>
          </div>
        </header>

        <aside className={`lumi-history-sidebar ${historyOpen ? 'open' : ''}`}>
          <div className="lumi-history-head">
            <div><span>YOUR CHATS</span><strong>History</strong></div>
            <button type="button" onClick={startNewChat}>＋ New Chat</button>
          </div>
          <div className="lumi-history-list">
            {chats.length === 0 && <div className="lumi-history-empty"><span>✦</span><p>No saved chats yet.</p><small>Your first message will start one.</small></div>}
            {chats.map((chat) => (
              <article className={activeChatId === chat.id ? 'active' : ''} key={chat.id}>
                <button className="lumi-history-open" type="button" onClick={() => openChat(chat)}>
                  <strong>{chat.title}</strong>
                  <small>{new Date(chat.updated_at).toLocaleString()}</small>
                </button>
                <div className="lumi-history-actions">
                  <button type="button" onClick={() => void renameChat(chat)} aria-label={`Rename ${chat.title}`}>✎</button>
                  <button type="button" onClick={() => void removeChat(chat)} aria-label={`Delete ${chat.title}`}>⌫</button>
                </div>
              </article>
            ))}
          </div>
        </aside>

        <aside className="lumi-v4-context">
          <div className="lumi-v4-context-head">
            <span>PROJECT BRAIN</span>
            <strong>{projectMeta?.title || 'Studio context'}</strong>
            <small>Lumi uses this live context while you work.</small>
          </div>

          <div className="lumi-v4-context-stats">
            <article><span>Episodes</span><strong>{selectedEpisodes.length}</strong></article>
            <article><span>Artists</span><strong>{musicArtists}</strong></article>
            <article><span>Releases</span><strong>{musicReleases}</strong></article>
            <article><span>Tracks</span><strong>{musicTracks}</strong></article>
          </div>

          <section className="lumi-v4-context-section">
            <div><span>STATUS</span><strong>What Lumi knows</strong></div>
            <p>{selectedShow?.description || (projectMeta?.project_kind === 'music' ? 'Music workspace — releases, tracks, videos, artwork, and timed lyrics.' : projectMeta?.project_kind === 'mixed' ? 'Mixed workspace — shows, episodes, music, publishing, and audience updates.' : 'Show workspace — episodes, talent, publishing, and audience updates.')}</p>
            <small>{timedTracks} track{timedTracks === 1 ? '' : 's'} with timed lyrics · {publications.length} Lumi publication{publications.length === 1 ? '' : 's'}</small>
          </section>

          <section className="lumi-v4-context-section">
            <div><span>ACTIONS</span><strong>Quick run</strong></div>
            <div className="lumi-v4-action-stack">
              <button type="button" onClick={() => { setMode('create'); fillPrompt('Draft a site news update for this project') }}>Draft News</button>
              <button type="button" onClick={() => { setMode('run'); fillPrompt('Prepare a music release for EBG+ Music') }}>Music Release</button>
              <button type="button" onClick={() => openImageGenerator()}>Generate Image</button>
              <button type="button" onClick={() => { setMode('run'); fillPrompt('Generate timed lyrics for a track') }}>Timed Lyrics</button>
              <button type="button" onClick={() => { setMode('chat'); fillPrompt('What should I work on next in this project?') }}>Next Steps</button>
            </div>
          </section>
        </aside>

        {!hasConversation && (
          <main className="studio-lumi-welcome">
            <div className="lumi-ambient-glow" aria-hidden="true" />
            <div className="lumi-welcome-copy">
              <span className="lumi-kicker">LUMI V4 ✦ {mode.toUpperCase()}</span>
              <h1>{activeChatId ? 'Welcome back.' : mode === 'chat' ? <>Let’s jump in, <span className="lumi-greeting-name">{greetingName}.</span></> : mode === 'create' ? 'What are we making?' : 'What should Lumi run?'}</h1>
              <p>{mode === 'chat' ? 'Think with Lumi using the full project context.' : mode === 'create' ? 'Create polished content, releases, copy, and production material.' : 'Prepare real Studio actions, gather missing info, and review before anything changes.'}</p>
            </div>

            <form className="studio-lumi-composer hero-composer" onSubmit={send}>
              <span className="composer-spark" aria-hidden="true">✦</span>
              <input id="studio-lumi-input" name="message" placeholder={selectedShow ? `Ask Lumi about ${selectedShow.title}` : projectMeta ? `Ask Lumi about ${projectMeta.title}` : 'Choose a Studio project first'} autoComplete="off" disabled={!projectId || busy} />
              <button className="lumi-send-button" type="submit" disabled={!projectId || busy} aria-label="Send to Lumi">➜</button>
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

            <small className="lumi-readonly-note">Lumi can publish News, viewer notifications, and Music releases only after you review and approve the details.</small>
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
                  <span>{message.role === 'lumi' ? 'Lumi ✦' : profileName}</span>
                  <p>{message.text}</p>
                  {message.imageUrl && (
                    <div className="lumi-generated-image">
                      <img src={message.imageUrl} alt={message.imagePrompt || 'Lumi generated image'} />
                      <div>
                        <a href={message.imageUrl} target="_blank" rel="noreferrer">Open image ↗</a>
                        <button type="button" onClick={() => openImageGenerator(message.imagePrompt || '')}>Regenerate</button>
                      </div>
                    </div>
                  )}
                  {message.role === 'lumi' && !message.imageUrl && (
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
                {quickPrompts.map((prompt) => <button type="button" key={prompt} onClick={() => fillPrompt(prompt)}>{prompt}</button>)}
              </div>
              <form className="studio-lumi-composer" onSubmit={send}>
                <span className="composer-spark" aria-hidden="true">✦</span>
                <input id="studio-lumi-input" name="message" placeholder={selectedShow ? `Ask Lumi about ${selectedShow.title}` : projectMeta ? `Ask Lumi about ${projectMeta.title}` : 'No Studio project selected'} autoComplete="off" disabled={!projectId || busy} />
                <button className="lumi-send-button" type="submit" disabled={!projectId || busy} aria-label="Send to Lumi">{busy ? '…' : '➜'}</button>
              </form>
              <small className="lumi-readonly-note">Lumi only sees the selected private project. Publishing always requires your review.</small>
            </div>
          </main>
        )}

        {imageOpen && (
          <div className="lumi-publish-backdrop lumi-info-backdrop" role="presentation">
            <form className="lumi-publish-sheet lumi-info-sheet lumi-image-sheet" onSubmit={generateImage}>
              <header>
                <div><span>LUMI ✦ IMAGE STUDIO</span><h2>Generate an image.</h2><p>Describe what you want. Lumi will generate it and save it with this Studio project.</p></div>
                <button type="button" disabled={imageGenerating} onClick={() => setImageOpen(false)} aria-label="Close image generator">×</button>
              </header>
              <div className="lumi-info-grid">
                <label className="full">What should Lumi make?<textarea rows={6} required value={imagePrompt} placeholder="A glossy early-2000s R&B album cover with..." onChange={(event) => setImagePrompt(event.target.value)} /></label>
                <label>Image type<select value={imageKind} onChange={(event) => setImageKind(event.target.value as LumiImageKind)}><option value="cover-art">Cover Art</option><option value="promo-poster">Promo Poster</option><option value="character-visual">Character Visual</option><option value="social-graphic">Social Graphic</option><option value="custom">Custom</option></select></label>
                <label>Shape<select value={imageAspect} onChange={(event) => setImageAspect(event.target.value as LumiImageAspect)}><option value="square">Square</option><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select></label>
              </div>
              <footer>
                <button className="button secondary" type="button" disabled={imageGenerating} onClick={() => setImageOpen(false)}>Cancel</button>
                <button className="button" type="submit" disabled={imageGenerating || !imagePrompt.trim()}>{imageGenerating ? 'Generating…' : 'Generate Image ✦'}</button>
              </footer>
            </form>
          </div>
        )}

        {musicInfoOpen && (
          <div className="lumi-publish-backdrop lumi-info-backdrop" role="presentation">
            <form className="lumi-publish-sheet lumi-info-sheet" onSubmit={submitMusicDetails}>
              <header>
                <div><span>LUMI ✦ NEEDS INFO</span><h2>I need a few details.</h2><p>Fill these in and submit them to Lumi. I’ll use them to finish the Music release setup.</p></div>
                <button type="button" disabled={publishing} onClick={() => setMusicInfoOpen(false)} aria-label="Close Lumi question">×</button>
              </header>
              <div className="lumi-info-grid">
                <label>Artist name<input value={musicDetails.artistName} required placeholder="Bijou Nicole" onChange={(event) => setMusicDetails({ ...musicDetails, artistName: event.target.value })} /></label>
                <label>Release title<input value={musicDetails.title} required placeholder="SOUL TIES" onChange={(event) => setMusicDetails({ ...musicDetails, title: event.target.value })} /></label>
                <label>Release type<select value={musicDetails.releaseType} onChange={(event) => setMusicDetails({ ...musicDetails, releaseType: event.target.value as MusicDetails['releaseType'] })}><option value="single">Single</option><option value="ep">EP</option><option value="album">Album</option></select></label>
                <label>Genre<input value={musicDetails.genre} placeholder="R&B" onChange={(event) => setMusicDetails({ ...musicDetails, genre: event.target.value })} /></label>
                <label>Release date<input type="date" value={musicDetails.releaseDate} onChange={(event) => setMusicDetails({ ...musicDetails, releaseDate: event.target.value })} /></label>
                <label>Status<select value={musicDetails.publishStatus} onChange={(event) => setMusicDetails({ ...musicDetails, publishStatus: event.target.value as MusicDetails['publishStatus'] })}><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="live">Live</option></select></label>
                <label className="full">Cover art<input type="file" accept="image/*" onChange={(event) => setMusicCoverFile(event.target.files?.[0] ?? null)} /><small>{musicCoverFile?.name || (musicDetails.coverUrl ? 'Current cover ready' : 'Optional — you can add it later')}</small></label>
                <label className="lumi-info-check full"><input type="checkbox" checked={musicDetails.explicit} onChange={(event) => setMusicDetails({ ...musicDetails, explicit: event.target.checked })} /> Explicit release</label>
              </div>
              <footer>
                <button className="button secondary" type="button" disabled={publishing} onClick={() => setMusicInfoOpen(false)}>Cancel</button>
                <button className="button" type="submit" disabled={publishing}>{publishing ? 'Submitting…' : 'Submit to Lumi'}</button>
              </footer>
            </form>
          </div>
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
                {!publishDraft.editingId && <button type="button" className={publishDraft.kind === 'music' ? 'active' : ''} onClick={chooseMusicDestination}><strong>Music Release</strong><small>Send a single, EP, or album to EBG+ Music.</small></button>}
              </div>

              {publishDraft.kind !== 'music' ? (
                <>
                  <label>Title<input value={publishDraft.title} maxLength={120} required onChange={(event) => setPublishDraft({ ...publishDraft, title: event.target.value })} /></label>
                  <label>Body<textarea value={publishDraft.body} required rows={10} onChange={(event) => setPublishDraft({ ...publishDraft, body: event.target.value })} /></label>
                  {publishDraft.kind === 'notification' && <label>Optional link<input value={publishDraft.link} placeholder="/app/shows/..." onChange={(event) => setPublishDraft({ ...publishDraft, link: event.target.value })} /></label>}
                </>
              ) : (
                <div className="lumi-music-review">
                  <div><span>Artist</span><strong>{musicDetails.artistName || 'Needed'}</strong></div>
                  <div><span>Release</span><strong>{musicDetails.title || 'Needed'}</strong></div>
                  <div><span>Type</span><strong>{musicDetails.releaseType.toUpperCase()}</strong></div>
                  <div><span>Status</span><strong>{musicDetails.publishStatus}</strong></div>
                  <div><span>Date</span><strong>{musicDetails.releaseDate || 'Not set'}</strong></div>
                  <div><span>Genre</span><strong>{musicDetails.genre || 'Not set'}</strong></div>
                  <button className="button secondary" type="button" onClick={() => setMusicInfoOpen(true)}>Edit Details</button>
                </div>
              )}

              <footer>
                <button className="button secondary" type="button" disabled={publishing} onClick={() => setPublishDraft(null)}>Keep Editing in Lumi</button>
                <button className="button" type="submit" disabled={publishing || (publishDraft.kind !== 'music' && (!publishDraft.title.trim() || !publishDraft.body.trim()))}>{publishing ? (publishDraft.editingId ? 'Saving…' : 'Publishing…') : (publishDraft.editingId ? 'Save Changes' : 'Publish to EBG+')}</button>
              </footer>
            </form>
          </div>
        )}
      </div>
    </section>
  )
}
