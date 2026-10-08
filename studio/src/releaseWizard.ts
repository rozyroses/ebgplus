export function assertReleaseAudio(status: string, tracks: Array<{ audioUrl: string }>) {
  if (!['live','scheduled'].includes(status)) return
  if (!tracks.length || tracks.some(track => { try { return new URL(track.audioUrl).protocol !== 'https:' } catch { return true } })) {
    throw new Error('Upload audio for every track before publishing or scheduling this release. You can save it as a draft first.')
  }
}
export function attachReleaseTracks<T extends { id: string; artistId: string; releaseId?: string }>(existing: T[], pending: T[], releaseId: string, artistId: string): T[] {
  const pendingIds = new Set(pending.map(track => track.id))
  return [...existing.filter(track => track.releaseId !== releaseId && !pendingIds.has(track.id)), ...pending.map(track => ({ ...track, artistId, releaseId }))]
}

export function replaceTrackAudio<T extends { audioUrl:string }>(track:T,audioUrl:string,isFlac=false) {
  return {...track,audioUrl,originalAudioUrl:undefined,losslessUrl:isFlac?audioUrl:'',losslessMimeType:isFlac?'audio/flac':'',atmosUrl:'',lyrics:'',timedLyrics:[],duration:undefined}
}
