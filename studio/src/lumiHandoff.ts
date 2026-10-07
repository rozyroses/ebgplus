export type CreatorCms = {
  [key: string]: unknown
  shows?: Array<{ id: string; title: string; [key: string]: unknown }>
  episodes?: Array<{ id: string; title: string; [key: string]: unknown }>
  music?: { [key: string]: unknown; releases?: Array<{ id: string; title: string; [key: string]: unknown }> }
}
export type Destination = 'poster' | 'banner' | 'logo' | 'thumbnail' | 'cover' | 'description' | 'synopsis'
export const destinationFields = {
  poster: ['shows', 'artwork'], banner: ['shows', 'banner'], logo: ['shows', 'logoImage'],
  thumbnail: ['episodes', 'thumbnail'], cover: ['releases', 'cover'],
  description: ['shows', 'description'], synopsis: ['episodes', 'synopsis'],
} as const
export function applyLumiHandoff(cms: CreatorCms, destination: Destination, id: string, value: string) {
  const [collection, field] = destinationFields[destination]
  if (!value.trim()) throw new Error('Add content before saving.')
  if (!['description', 'synopsis'].includes(destination)) {
    const url = new URL(value)
    if (url.protocol !== 'https:') throw new Error('Artwork must use a secure HTTPS link.')
  }
  const records = collection === 'releases' ? cms.music?.releases : cms[collection]
  if (!records?.some((item) => item.id === id)) throw new Error('This item is no longer available. Choose another destination.')
  const updated = records.map((item) => item.id === id ? { ...item, [field]: value.trim() } : item)
  return collection === 'releases'
    ? { ...cms, music: { ...cms.music, releases: updated } }
    : { ...cms, [collection]: updated }
}
