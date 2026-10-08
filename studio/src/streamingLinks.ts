export function cleanLinkSlug(value:string) {
  const slug=value.trim().toLowerCase()
  return /^[a-z0-9][a-z0-9-]{1,59}(\/[a-z0-9][a-z0-9-]{1,79})?$/.test(slug)?slug:''
}
export function brandedReleaseLink(slug:string) {
  return `https://studio.ebgplus.app/stream/${slug.split('/').map(encodeURIComponent).join('/')}`
}
