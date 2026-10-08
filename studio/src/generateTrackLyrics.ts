import { readStoredSession } from '../../src/lib/auth'
import { uploadStudioProjectMedia } from '../../src/lib/studioData'
import { AudioSizeError, transcribeUploadedAudio, type Transcription } from './lyricsAudio'

export async function generateTrackLyrics(projectId: string, track: { id: string; audioUrl: string }, progress: (message: string) => void): Promise<Transcription> {
  const session = readStoredSession()
  if (!session) throw new Error('Sign in to EBG Studio again before generating timed lyrics.')
  if (!track.audioUrl) throw new Error('Upload the song audio before generating timed lyrics.')
  const endpoint = import.meta.env.VITE_STUDIO_LYRICS_URL || 'https://ebg-studio-lyrics.roosevelt-wooden.workers.dev'
  return transcribeUploadedAudio({
    audioUrl: track.audioUrl, progress,
    upload: file => uploadStudioProjectMedia(file, projectId, `lyrics/${track.id}`),
    transcribe: async audioUrl => {
      const response = await fetch(`${endpoint.replace(/\/$/, '')}/transcribe-lyrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ audioUrl, trackId: track.id }),
      })
      const result = await response.json().catch(() => ({})) as Transcription & { error?: string }
      if (!response.ok) {
        const message = result.error || `Timed lyric transcription failed (${response.status}).`
        if (response.status === 413 || /larger than|too large|size limit|24\s*MB/i.test(message)) throw new AudioSizeError(message)
        throw new Error(message)
      }
      if (!result.timedLyrics?.some(line => line.text?.trim())) throw new Error('No vocal lyric lines were detected. You can add lyrics manually or skip this step.')
      return result
    },
  })
}
