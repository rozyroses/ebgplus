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

export default function StudioBrandAssetDeleteControls() {
  useEffect(() => {
    let observer: MutationObserver | null = null

    const enhance = () => {
      if (window.location.hash.replace(/^#\/?/, '') !== 'series') return
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
          const assetName = field === 'artwork' ? 'poster' : field === 'banner' ? 'banner' : 'logo'
          if (!window.confirm(`Delete this ${assetName} from the selected title?`)) return
          try {
            const cms = await loadCmsData<CmsData>()
            if (!cms) throw new Error('Studio data could not be loaded.')
            const next = {
              ...cms,
              shows: cms.shows.map((show) => show.id === showId ? { ...show, [field]: '' } : show),
            }
            await saveCmsData(next)
            window.location.reload()
          } catch (error) {
            window.alert(error instanceof Error ? error.message : 'Asset could not be deleted.')
          }
        })
        label.appendChild(button)
      })
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
