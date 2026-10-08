export type MasterPreset = 'clean' | 'warm' | 'bright'
export const ceilingAmplitude = 10 ** (-1 / 20)
export function peakGain(channels: Float32Array[], ceiling = ceilingAmplitude) {
  let peak = 0
  for (const channel of channels) for (const sample of channel) {
    if (!Number.isFinite(sample)) throw new Error('The audio contains invalid samples.')
    peak = Math.max(peak, Math.abs(sample))
  }
  return peak > 0 ? Math.min(ceiling / peak, 4) : 1
}
export function encodePcm24(channels: Float32Array[], sampleRate: number): ArrayBuffer {
  if (!channels.length || channels.length > 2 || channels.some(c => c.length !== channels[0].length)) throw new Error('Use mono or stereo audio with matching channel lengths.')
  if (!Number.isInteger(sampleRate) || sampleRate < 8000 || sampleRate > 192000) throw new Error('Unsupported sample rate.')
  const frames = channels[0].length, dataBytes = frames * channels.length * 3
  const out = new ArrayBuffer(44 + dataBytes + (dataBytes % 2)), view = new DataView(out)
  const text = (offset: number, value: string) => { for (let i=0;i<value.length;i++) view.setUint8(offset+i,value.charCodeAt(i)) }
  text(0,'RIFF'); view.setUint32(4,out.byteLength-8,true); text(8,'WAVE'); text(12,'fmt '); view.setUint32(16,16,true); view.setUint16(20,1,true); view.setUint16(22,channels.length,true); view.setUint32(24,sampleRate,true); view.setUint32(28,sampleRate*channels.length*3,true); view.setUint16(32,channels.length*3,true); view.setUint16(34,24,true); text(36,'data'); view.setUint32(40,dataBytes,true)
  let offset=44
  for(let frame=0;frame<frames;frame++) for(const channel of channels) {
    if (!Number.isFinite(channel[frame])) throw new Error('The audio contains invalid samples.')
    const sample=Math.max(-1,Math.min(1,channel[frame])), n=Math.round(sample*(sample < 0 ? 8388608 : 8388607))
    view.setUint8(offset++,n & 255); view.setUint8(offset++,(n >> 8) & 255); view.setUint8(offset++,(n >> 16) & 255)
  }
  return out
}
export async function masterStereo(url: string, preset: MasterPreset): Promise<Blob> {
  const response=await fetch(url)
  if (!response.ok) throw new Error(`Audio could not be downloaded (${response.status}). Reopen the release to refresh its preview.`)
  if(Number(response.headers.get('content-length')) > 100*1024*1024) throw new Error('Use audio smaller than 100 MB for browser mastering.')
  const bytes=await response.arrayBuffer()
  if(bytes.byteLength > 100*1024*1024) throw new Error('Use audio smaller than 100 MB for browser mastering.')
  const decoder=new OfflineAudioContext(2,1,44100)
  let audio: AudioBuffer
  try { audio=await decoder.decodeAudioData(bytes) } catch { throw new Error('This browser cannot decode that file. Upload a PCM WAV version for mastering.') }
  if(audio.numberOfChannels > 2 || audio.duration > 600) throw new Error('Browser mastering supports mono/stereo songs up to 10 minutes. Upload a prepared master for longer or surround audio.')
  const context=new OfflineAudioContext(audio.numberOfChannels,audio.length,audio.sampleRate)
  const source=context.createBufferSource(); source.buffer=audio
  const low=context.createBiquadFilter(); low.type='lowshelf'; low.frequency.value=180; low.gain.value=preset==='warm'?1.5:0
  const high=context.createBiquadFilter(); high.type='highshelf'; high.frequency.value=6000; high.gain.value=preset==='bright'?1.5:preset==='warm'?-0.5:0
  const compressor=context.createDynamicsCompressor(); compressor.threshold.value=-18; compressor.knee.value=12; compressor.ratio.value=2; compressor.attack.value=0.02; compressor.release.value=0.2
  source.connect(low); low.connect(high); high.connect(compressor); compressor.connect(context.destination); source.start()
  const rendered=await context.startRendering(), channels=Array.from({length:rendered.numberOfChannels},(_,i)=>rendered.getChannelData(i).slice())
  const gain=peakGain(channels)
  for (const channel of channels) for(let i=0;i<channel.length;i++) channel[i]*=gain
  return new Blob([encodePcm24(channels,rendered.sampleRate)],{type:'audio/wav'})
}
