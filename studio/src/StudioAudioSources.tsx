import { useState } from 'react'
import type { FormEvent } from 'react'
import { uploadStudioProjectMedia } from '../../src/lib/studioData'
import { catalogTrack } from '../../src/lib/musicPlayback'

type Sources = { losslessUrl?: string; losslessMimeType?: string; atmosUrl?: string }
export default function StudioAudioSources({ projectId, track, onSave }: { projectId: string; track: Sources & { id: string; title: string }; onSave: (patch: Sources) => Promise<boolean> }) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const patch: Sources = { losslessUrl: String(form.get('losslessUrl') || '').trim(), losslessMimeType: String(form.get('losslessMimeType')), atmosUrl: String(form.get('atmosUrl') || '').trim() }
    setBusy(true); setMessage('')
    try {
      if (!projectId) throw new Error('Choose a Studio project first.')
      const lossless = form.get('losslessFile') as File
      const atmos = form.get('atmosFile') as File
      if (lossless?.size && !/\.(flac|wav)$/i.test(lossless.name)) throw new Error('Use a FLAC or PCM WAV master.')
      if (atmos?.size && !/\.(mp4|m4a)$/i.test(atmos.name)) throw new Error('Use a Dolby Digital Plus JOC mix in an MP4 or M4A container.')
      if ((patch.atmosUrl || atmos?.size) && form.get('confirmAtmos') !== 'on') throw new Error('Confirm that this file contains a genuine Dolby Atmos mix.')
      for (const url of [patch.losslessUrl, patch.atmosUrl]) if (url && !/^https?:\/\//i.test(url)) throw new Error('Audio URLs must start with https:// or http://.')
      if (lossless?.size) {
        patch.losslessMimeType = /\.flac$/i.test(lossless.name) ? 'audio/flac' : 'audio/wav'
        patch.losslessUrl = await uploadStudioProjectMedia(lossless, projectId, `music/lossless/${track.id}`)
      }
      if (atmos?.size) patch.atmosUrl = await uploadStudioProjectMedia(atmos, projectId, `music/atmos/${track.id}`)
      const sources = catalogTrack(patch, '').sources
      if (patch.losslessUrl && !sources.some(source => source.quality === 'lossless')) throw new Error('The lossless URL must contain FLAC or PCM WAV audio.')
      if (patch.atmosUrl && !sources.some(source => source.quality === 'atmos')) throw new Error('The Atmos URL must use an MP4 or M4A container.')
      if (!(await onSave(patch))) throw new Error('Sources were not saved. Your inputs are retained; retry when the connection is restored.')
      setMessage('Audio sources saved. Preview the track to check playback on this device.')
      formElement.reset()
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Audio sources could not be saved.') }
    finally { setBusy(false) }
  }
  return <details className="studio-audio-sources"><summary>Manage audio quality · {track.title}</summary><form onSubmit={save}>
    <p>Keep a standard stereo source for fallback. Add a genuine FLAC/PCM WAV master or Dolby Atmos DD+ JOC mix. For large masters, use a hosted URL if your storage upload limit is reached.</p>
    <label>Lossless URL<input name="losslessUrl" type="url" defaultValue={track.losslessUrl || ''} /></label>
    <label>Lossless format<select name="losslessMimeType" defaultValue={track.losslessMimeType || 'audio/flac'}><option value="audio/flac">FLAC</option><option value="audio/wav">PCM WAV</option></select></label>
    <label>Or upload lossless master<input name="losslessFile" type="file" accept=".flac,.wav" /></label>
    <label>Dolby Atmos URL<input name="atmosUrl" type="url" defaultValue={track.atmosUrl || ''} /></label>
    <label>Or upload Atmos mix<input name="atmosFile" type="file" accept=".mp4,.m4a" /></label>
    <label className="studio-audio-confirm"><input name="confirmAtmos" type="checkbox" defaultChecked={!!track.atmosUrl} /> This is an actual Dolby Atmos DD+ JOC mix.</label>
    <p>Uploads replace the corresponding URL. Clear a URL to remove that alternate source. Atmos playback requires a compatible device and browser.</p>
    <button type="submit" disabled={busy}>{busy ? 'Saving audio…' : 'Save audio sources'}</button><p role="status">{message}</p>
  </form></details>
}
