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

    const addDeleteButton = (host: HTMLElement, field: AssetField, getShowId: () => string | undefined, className: string) => {
      if (host.querySelector(`.${className}`)) return
      const button = document.createElement('button')
      button.type = 'button'
      button.className = `button danger ${className}`
      button.textContent = 'Delete'
      button.addEventListener('click', async (event) => {
        event.preventDefault()
        event.stopPropagation()
        const showId = getShowId()
        if (!showId) return window.alert('Could not identify the selected title.')
        if (!window.confirm(`Delete this ${assetLabel(field)} from the selected title?`)) return
        try {
          await clearAsset(showId, field)
          window.location.reload()
        } catch (error) {
          window.alert(error instanceof Error ? error.message : 'Asset could not be deleted.')
        }
      })
      host.appendChild(button)
    }

    const enhanceSeries = () => {
      const labels = Array.from(document.querySelectorAll<HTMLElement>('.series-v2-media-grid > label'))
      labels.forEach((label, index) => {
        const field = fields[index]
        if (!field) return
        addDeleteButton(
          label,
          field,
          () => {
            const liveLink = document.querySelector<HTMLAnchorElement>('.series-v2-card-head a[href*="/app/shows/"]')
            return liveLink?.href.match(/\/app\/shows\/([^/?#]+)/)?.[1]
          },
          'series-v2-delete-asset',
        )
      })
    }

    const enhanceMedia = () => {
      const cards = Array.from(document.querySelectorAll<HTMLElement>('.media-grid > .media-card'))
      cards.forEach((card, index) => {
        const field = fields[index]
        if (!field) return
        addDeleteButton(
          card,
          field,
          () => document.querySelector<HTMLSelectElement>('.top-actions select')?.value,
          'media-delete-asset',
        )
      })
    }

    const enhance = () => {
      const tab = window.location.hash.replace(/^#\/?/, '')
      if (tab === 'series') enhanceSeries()
      if (tab === 'media') enhanceMedia()
    }

    const sync = () => {
      enhance()
      observer?.disconnect()
      observer = new MutationObserver(enhance)
      observer.observe(document.body, { childList: true, subtree: true })
    }

    window.addEventListener('hashchange', sync)
    sync()
    return () => {
      window.removeEventListener('hashchange', sync)
      observer?.disconnect()
    }
  }, [])

  return null
}
