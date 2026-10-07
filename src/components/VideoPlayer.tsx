import { useViewerPreferences } from '../lib/viewerPreferences'
import { useEffect, useRef, useState } from 'react'
import { usePlaybackAnalytics } from '../lib/playbackAnalytics'
import './VideoPlayer.css'
const time = (value: number) => { const seconds = Math.max(0, Math.floor(Number.isFinite(value) ? value : 0)); return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}` }
type SafariVideo = HTMLVideoElement & { webkitEnterFullscreen?: () => void }
export default function VideoPlayer({ src, poster, title = 'EBG+ Video', contentId, autoPlay = false, startAt = 0, onProgress, onEnded }: { src: string; poster?: string; title?: string; contentId?: string; autoPlay?: boolean; startAt?: number; onProgress?: (seconds: number) => void; onEnded?: () => void }) {
  const preferences = useViewerPreferences()
  const video = useRef<HTMLVideoElement>(null), shell = useRef<HTMLDivElement>(null)
  const [playing,setPlaying] = useState(false), [current,setCurrent] = useState(0), [duration,setDuration] = useState(0), [volume,setVolume] = useState(preferences.volume), [muted,setMuted] = useState(false), [speed,setSpeed] = useState(preferences.speed), [loading,setLoading] = useState(true), [error,setError] = useState(''), [notice,setNotice] = useState(''), [pip,setPip] = useState(false)
  useEffect(() => { setSpeed(preferences.speed); setVolume(preferences.volume); if(video.current) { video.current.playbackRate=preferences.speed; video.current.volume=preferences.volume } }, [preferences.speed, preferences.volume])
  const analytics = usePlaybackAnalytics(contentId, title, 'video')
  const lastSave = useRef(0)
  const progressCallback = useRef(onProgress)
  progressCallback.current = onProgress
  useEffect(() => { setPip(Boolean(document.pictureInPictureEnabled)); setPlaying(false); setCurrent(0); setDuration(0); setLoading(true); setError(''); setNotice(''); lastSave.current=0 }, [src])
  const save = () => { if(video.current && !video.current.ended) progressCallback.current?.(video.current.currentTime) }
  useEffect(() => { const hidden = () => { if(document.visibilityState==='hidden') save() }; document.addEventListener('visibilitychange',hidden); return () => { save(); document.removeEventListener('visibilitychange',hidden) } }, [src])
  const toggle = async () => { const media=video.current; if(!media) return; if(media.paused) { try { await media.play(); setNotice('') } catch { setLoading(false); setNotice('Tap play to start, or try reloading the video.') } } else media.pause() }
  const seek = (value: number) => { const media=video.current; if(!media || !Number.isFinite(media.duration)) return; media.currentTime=Math.max(0,Math.min(media.duration,value)); setCurrent(media.currentTime); save() }
  const fullscreen = async () => { try { if(document.fullscreenElement) await document.exitFullscreen(); else if(shell.current?.requestFullscreen) await shell.current.requestFullscreen(); else (video.current as SafariVideo)?.webkitEnterFullscreen?.() } catch { setNotice('Fullscreen isn’t available in this browser.') } }
  const picture = async () => { try { if(document.pictureInPictureElement) await document.exitPictureInPicture(); else await video.current?.requestPictureInPicture() } catch { setNotice('Picture-in-picture isn’t available for this video.') } }
  return <div ref={shell} className="ebg-video-player ebg-video-v2" tabIndex={0} aria-label={`${title} player`} onKeyDown={event=>{
    if(!preferences.keyboard) return
    if(event.target!==event.currentTarget && event.target!==video.current) return
    if(event.key===' ' || event.key.toLowerCase()==='k') { event.preventDefault(); void toggle() }
    if(event.key==='ArrowLeft') { event.preventDefault(); seek(current-10) }
    if(event.key==='ArrowRight') { event.preventDefault(); seek(current+10) }
    if(event.key.toLowerCase()==='f') void fullscreen()
    if(event.key.toLowerCase()==='m' && video.current) video.current.muted=!video.current.muted
  }}>
    <video key={src} ref={video} src={src} poster={poster} autoPlay={autoPlay} playsInline preload="metadata" onLoadedMetadata={event=>{
      const media=event.currentTarget; setDuration(Number.isFinite(media.duration)?media.duration:0); media.playbackRate=speed; media.volume=volume; media.muted=muted
      if(startAt>0 && startAt<media.duration-2) { media.currentTime=startAt; setCurrent(startAt); setNotice(`Resuming at ${time(startAt)}.`) }
      setLoading(false)
    }} onTimeUpdate={event=>{const value=event.currentTarget.currentTime; setCurrent(value); if(performance.now()-lastSave.current>5000) { save(); lastSave.current=performance.now() } }} onPlaying={()=>{setPlaying(true);setLoading(false);analytics.onPlaying()}} onPause={()=>{setPlaying(false);save();analytics.onPause()}} onWaiting={()=>{setLoading(true);analytics.onWaiting()}} onSeeking={()=>analytics.onWaiting()} onCanPlay={()=>setLoading(false)} onEnded={()=>{setPlaying(false);setLoading(false);analytics.onEnded();onEnded?.()}} onVolumeChange={event=>{setVolume(event.currentTarget.volume);setMuted(event.currentTarget.muted)}} onError={()=>{setLoading(false);setPlaying(false);analytics.onPause();setError('This video couldn’t load. Check your connection and try again.')}} />
    <div className="video-v2-title">{title}</div>
    {loading && !error && <div className="video-v2-status" role="status">Loading video…</div>}
    {error ? <div className="video-v2-status" role="alert"><p>{error}</p><button type="button" onClick={()=>{setError('');setLoading(true);video.current?.load()}}>Retry video</button></div> : !playing && !loading && <button type="button" className="video-v2-center" aria-label="Play video" onClick={()=>void toggle()}>▶</button>}
    <div className="video-v2-controls">
      <div className="video-v2-timeline"><span>{time(current)}</span><input type="range" min={0} max={duration||1} step={0.1} value={Math.min(current,duration||0)} disabled={!duration} aria-label="Video position" aria-valuetext={`${time(current)} of ${time(duration)}`} onChange={event=>seek(Number(event.target.value))}/><span>{time(duration)}</span></div>
      <div className="video-v2-actions"><button type="button" aria-label={playing?'Pause video':'Play video'} disabled={!!error} onClick={()=>void toggle()}>{playing?'❚❚':'▶'}</button><button type="button" aria-label="Back 10 seconds" onClick={()=>seek(current-10)}>−10s</button><button type="button" aria-label="Forward 10 seconds" onClick={()=>seek(current+10)}>+10s</button><button type="button" aria-label={muted?'Unmute':'Mute'} onClick={()=>{if(video.current) video.current.muted=!video.current.muted}}>{muted || volume===0?'Unmute':'Mute'}</button><input className="video-v2-volume" type="range" min={0} max={1} step={0.05} value={muted?0:volume} aria-label="Video volume" onChange={event=>{if(video.current){video.current.volume=Number(event.target.value);video.current.muted=false}}}/><label className="video-v2-speed">Speed<select value={speed} onChange={event=>{const value=Number(event.target.value);setSpeed(value);if(video.current) video.current.playbackRate=value}}>{[0.5,0.75,1,1.25,1.5,2].map(value=><option key={value} value={value}>{value}×</option>)}</select></label>{pip && <button type="button" onClick={()=>void picture()} aria-label="Picture-in-picture">PiP</button>}<button type="button" onClick={()=>void fullscreen()} aria-label="Toggle fullscreen">⛶</button></div>
      {notice && <p className="video-v2-notice" role="status">{notice} {current>0 && <button type="button" onClick={()=>{seek(0);setNotice('')}}>Start over</button>}</p>}
    </div>
  </div>
}
