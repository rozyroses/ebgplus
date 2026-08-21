import { useEffect } from 'react'
import { loadCmsData, saveCmsData } from '../../src/lib/studioData'

type Show = {
  id: string
  artwork: string
  banner?: string
  logoImage?: string
}

type CmsData = {
  shows: Show[]
  [key: string]: unknown
}

const fields = ['artwork', 'banner', 'logoImage'] as const

type AssetField = (typeof fields)[number]

const assetLabel = (field: AssetField) => field === 'artwork' ? 'poster' : field === 'banner' ? 'banner' : 'logo'

const clearAsset = async (showId: string, field: AssetField) => {
  const cms = await loadCmsData<CmsData>()
  if (!cms) throw new Error('Studio data could not be loaded.')
  await saveCmsData({
    ...cms,
    shows: cms.shows.map((show) => show.id === showId ? { ...show, [field]: '' } : show),
  })
}

export default function StudioBrandAssetDeleteControls() {
  useEffect(() => {
    let observer: MutationObserver | null = null
    let mediaSyncToken = 0

    const enhanceSeries = () => {
      const labels = Array.from(document.querySelectorAll<HTMLElement>('.series-v2-media-grid > label'))
      labels.forEach((label, index) => {
        if (label.querySelector('.series-v2-delete-asset')) return
        const field = fields[index]
        if (!field) return
        const button = document.createElement('button')
        button.type = 'button'
        button.className = 'button danger series-v2-delete-asset'
        button.textContent = 'Delete asset'
        button.addEventListener('click', async (event) => {
          event.preventDefault()
          event.stopPropagation()
          const liveLink = document.querySelector<HTMLAnchorElement>('.series-v2-card-head a[href*="/app/shows/"]')
          const match = liveLink?.href.match(/\/app\/shows\/([^/?#]+)/)
          const showId = match?.[1]
          if (!showId) return window.alert('Could not identify the selected title.')
          if (!window.confirm(`Delete this ${assetLabel(field)} from the selected title?`)) return
          try {
            await clearAsset(showId, field)
            window.location.reload()
          } catch (error) {
            window.alert(error instanceof Error ? error.message : 'Asset could not be deleted.')
          }
        })
        label.appendChild(button)
      })
    }

    const enhanceMedia = async () => {
      const token = ++mediaSyncToken
      const select = document.querySelector<HTMLSelectElement>('.top-actions select')
      const showId = select?.value
      if (!showId) return
      const cards = Array.from(document.querySelectorAll<HTMLElement>('.media-grid > .media-card'))
      if (!cards.length) return

      let cms: CmsData | null = null
      try {
        cms = await loadCmsData<CmsData>()
      } catch {
        return
      }
      if (token !== mediaSyncToken || !cms) return
      const show = cms.shows.find((item) => item.id === showId)
      if (!show) return

      cards.forEach((card, index) => {
        const field = fields[index]
        if (!field) return
        const value = show[field]
        const preview = card.querySelector<HTMLElement>('.media-preview')
        if (!value && preview && preview.dataset.assetEmpty !== field) {
          preview.dataset.assetEmpty = field
          preview.replaceChildren(Object.assign(document.createElement('strong'), { textContent: `No ${assetLabel(field)}` }))
        }

        if (card.querySelector('.media-delete-asset')) return
        const button = document.createElement('button')
        button.type = 'button'
        button.className = 'button danger media-delete-asset'
        button.textContent = 'Delete'
        button.disabled = !value
        button.title = value ? `Delete ${assetLabel(field)}` : `No ${assetLabel(field)} to delete`
        button.addEventListener('click', async (event) => {
          event.preventDefault()
          event.stopPropagation()
          const activeShowId = document.querySelector<HTMLSelectElement>('.top-actions select')?.value
          if (!activeShowId) return window.alert('Could not identify the selected title.')
          if (!window.confirm(`Delete this ${assetLabel(field)} from the selected title?`)) return
          try {
            await clearAsset(activeShowId, field)
            window.location.reload()
          } catch (error) {
            window.alert(error instanceof Error ? error.message : 'Asset could not be deleted.')
          }
        })
        card.appendChild(button)
      })
    }

    const enhance = () => {
      const tab = window.location.hash.replace(/^#\/?/, '')
      if (tab === 'series') enhanceSeries()
      if (tab === 'media') void enhanceMedia()
    }

    const sync = () => {
      enhance()
      observer?.disconnect()
      observer = new MutationObserver(enhance)
      observer.observe(document.body, { childList: true, subtree: true })
    }

    const onChange = (event: Event) => {
      if (event.target instanceof HTMLSelectElement && event.target.closest('.top-actions')) enhance()
    }

    window.addEventListener('hashchange', sync)
    document.addEventListener('change', onChange)
    sync()
    return () => {
      window.removeEventListener('hashchange', sync)
      document.removeEventListener('change', onChange)
      observer?.disconnect()
    }
  }, [])

  return null
}
