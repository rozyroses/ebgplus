import './lumiVoice.css'
import { pcmWave } from './voiceAudio'
import { useEffect, useRef, useState } from 'react'
import { transcribeLumiAudio } from './lib/studioData'


export default function LumiVoiceInput({ projectId, onUse, onClose }: { projectId: string; onUse: (text: string) => void; onClose: () => void }) {
  const [recording, setRecording] = useState(false)
  const [busy, setBusy] = useState(false)
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const recorder = useRef<MediaRecorder | null>(null)
  const stream = useRef<MediaStream | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const controller = useRef<AbortController | null>(null)
  const alive = useRef(true)
  useEffect(() => { alive.current = true; return () => {
    alive.current = false; controller.current?.abort()
    if (timer.current) clearTimeout(timer.current)
    if (recorder.current?.state === 'recording') { recorder.current.onstop = null; recorder.current.stop() }
    stream.current?.getTracks().forEach(track => track.stop())
  } }, [])
  async function transcribe(blob: Blob) {
    setBusy(true); setError(''); setText('')
    let context: AudioContext | undefined
    try {
      if (blob.size > 10 * 1024 * 1024) throw new Error('Choose an audio file smaller than 10 MB.')
      context = new AudioContext()
      const audio = await context.decodeAudioData(await blob.arrayBuffer())
      if (audio.duration > 120 || !audio.length) throw new Error('Choose a clip up to two minutes long.')
      const offline = new OfflineAudioContext(1, Math.ceil(audio.duration * 24000), 24000)
      const source = offline.createBufferSource(); source.buffer = audio; source.connect(offline.destination); source.start()
      const converted = await offline.startRendering()
      if (!alive.current) return
      controller.current = new AbortController()
      const result = await transcribeLumiAudio(projectId, pcmWave(converted.getChannelData(0)), controller.current.signal)
      if (alive.current) setText(result)
    } catch (reason) { if (alive.current) setError(reason instanceof Error ? reason.message : 'Could not transcribe this audio.') }
    finally { await context?.close(); if (alive.current) setBusy(false) }
  }
  async function start() {
    setError(''); setBusy(true)
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') throw new Error('Recording is unavailable in this browser. Upload an audio file instead.')
      const acquired = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (!alive.current) { acquired.getTracks().forEach(track => track.stop()); return }
      stream.current = acquired
      const instance = new MediaRecorder(acquired); recorder.current = instance
      const parts: BlobPart[] = []
      instance.ondataavailable = event => { if (event.data.size) parts.push(event.data) }
      instance.onstop = () => {
        if (timer.current) clearTimeout(timer.current)
        acquired.getTracks().forEach(track => track.stop()); setRecording(false)
        if (alive.current) void transcribe(new Blob(parts, { type: instance.mimeType }))
      }
      instance.start(); setRecording(true); setBusy(false)
      timer.current = setTimeout(() => { if (instance.state === 'recording') instance.stop() }, 120000)
    } catch (reason) { stream.current?.getTracks().forEach(track => track.stop()); setError(reason instanceof Error ? reason.message : 'Microphone access failed.'); setBusy(false) }
  }
  return <div className="lumi-voice-panel" role="dialog" aria-label="Voice input">
    <div><strong>Talk to Lumi</strong><button type="button" className="button secondary" onClick={onClose}>Close</button></div>
    <p>Record or upload up to two minutes. Review the transcript before sending. Audio is sent for transcription and isn’t saved in Studio.</p>
    <button type="button" className="button" disabled={busy} onClick={() => recording ? recorder.current?.stop() : void start()}>{recording ? 'Stop and transcribe' : 'Record message'}</button>
    <label>Upload audio <input type="file" accept="audio/*" disabled={busy || recording} onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void transcribe(file) }} /></label>
    {busy && <p role="status">Transcribing…</p>}
    {error && <p role="alert">{error}</p>}
    <label>Transcript<textarea value={text} onChange={event => setText(event.target.value)} placeholder="Your transcript will appear here" disabled={busy || recording} /></label>
    <button type="button" className="button" disabled={!text.trim() || busy || recording} onClick={() => { onUse(text.trim()); onClose() }}>Use in message</button>
  </div>
}
