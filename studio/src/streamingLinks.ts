export function cleanLinkSlug(value:string) {
  const slug=value.trim().toLowerCase()
  return /^[a-z0-9][a-z0-9-]{1,59}(\/[a-z0-9][a-z0-9-]{1,79})?$/.test(slug)?slug:''
}
export function brandedReleaseLink(slug:string) {
  return `https://streaming.ebgplus.app/${slug.split('/').map(encodeURIComponent).join('/')}`
}

export function streamingRoute(hostname:string,pathname:string):string|null {
  const legacy=pathname.startsWith('/stream/')
  if(hostname !== 'streaming.ebgplus.app' && !legacy) return null
  const path=legacy?pathname.slice('/stream/'.length):pathname.replace(/^\//,'')
  try{return decodeURIComponent(path).replace(/\/+$/,'')}catch{return '__invalid__'}
}
