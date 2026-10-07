export type LyricLine = { start: number; end: number; text: string }
export type Transcription = { text?: string; timedLyrics?: LyricLine[]; language?: string | null }
const SAMPLE_RATE = 16000
const CHUNK_SECONDS = 300

export class AudioSizeError extends Error {}

export function assertLyricTranscript(result: Transcription): void {
  const texts = [result.text ?? '', ...(result.timedLyrics ?? []).map(line => line.text)]
  if (texts.some(text => /preserve repeated lines and short vocal phrases/i.test(text) || /do not invent words[^\n]{0,80}(instrumental|silence)/i.test(text))) {
    throw new Error('The lyrics service returned transcription instructions instead of song lyrics. Nothing was saved. The lyrics worker needs correcting before you generate again.')
  }
}


export function encodeMonoWav(samples: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buffer)
  const write = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i))
  }
  write(0, 'RIFF'); view.setUint32(4, buffer.byteLength - 8, true)
  write(8, 'WAVE'); write(12, 'fmt '); view.setUint32(16, 16, true)
  view.setUint16(20, 1, true); view.setUint16(22, 1, true)
  view.setUint32(24, SAMPLE_RATE, true); view.setUint32(28, SAMPLE_RATE * 2, true)
  view.setUint16(32, 2, true); view.setUint16(34, 16, true)
  write(36, 'data'); view.setUint32(40, samples.length * 2, true)
  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(44 + i * 2, Math.round(sample * (sample < 0 ? 32768 : 32767)), true)
  }
  return buffer
}

export async function* prepareLyricsAudio(audioUrl: string) {
  const response = await fetch(audioUrl)
  if (!response.ok) throw new Error('The uploaded audio could not be downloaded for lyric generation.')
  const bytes = await response.arrayBuffer()
  let decoded: AudioBuffer
  try {
    decoded = await new OfflineAudioContext(1, 1, SAMPLE_RATE).decodeAudioData(bytes)
  } catch {
    throw new Error('This browser could not read the audio format. Try generating lyrics in a browser that supports this file, or edit the lyrics manually.')
  }
  if (!Number.isFinite(decoded.duration) || decoded.duration <= 0) throw new Error('This audio file has no readable duration.')
  const total = Math.ceil(decoded.duration / CHUNK_SECONDS)
  for (let part = 0; part < total; part++) {
    const offset = part * CHUNK_SECONDS
    const duration = Math.min(CHUNK_SECONDS, decoded.duration - offset)
    const context = new OfflineAudioContext(1, Math.ceil(duration * SAMPLE_RATE), SAMPLE_RATE)
    const source = context.createBufferSource()
    source.buffer = decoded
    source.connect(context.destination)
    source.start(0, offset, duration)
    const rendered = await context.startRendering()
    const file = new File([encodeMonoWav(rendered.getChannelData(0))], `lyrics-part-${part + 1}.wav`, { type: 'audio/wav' })
    yield { file, offset, duration, part: part + 1, total }
  }
}

export async function transcribeUploadedAudio(options: {
  audioUrl: string
  transcribe: (url: string) => Promise<Transcription>
  upload: (file: File) => Promise<string>
  progress: (message: string) => void
  prepare?: typeof prepareLyricsAudio
}): Promise<Transcription> {
  try {
    const result = await options.transcribe(options.audioUrl)
    assertLyricTranscript(result)
    return result
  } catch (error) {
    if (!(error instanceof AudioSizeError)) throw error
  }
  options.progress('Preparing the larger audio file for lyrics…')
  const lines: LyricLine[] = []
  const texts: string[] = []
  let language: string | null | undefined
  for await (const chunk of (options.prepare ?? prepareLyricsAudio)(options.audioUrl)) {
    options.progress(`Timing lyrics · part ${chunk.part} of ${chunk.total}…`)
    const url = await options.upload(chunk.file)
    const result = await options.transcribe(url)
    assertLyricTranscript(result)
    if (result.text?.trim()) texts.push(result.text.trim())
    language ??= result.language
    for (const line of result.timedLyrics ?? []) {
      if (!Number.isFinite(line.start) || !Number.isFinite(line.end) || !line.text?.trim()) continue
      const start = Math.max(0, Math.min(chunk.duration, line.start))
      const end = Math.max(start, Math.min(chunk.duration, line.end))
      if (end > start) lines.push({ ...line, start: chunk.offset + start, end: chunk.offset + end })
    }
  }
  lines.sort((a, b) => a.start - b.start)
  return { text: texts.join('\n'), timedLyrics: lines, language }
}
