import { storage } from './supabase'
const base = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '') || ''
export const PRIVATE_MEDIA_BUCKET = 'ebg-studio-private'
export const privateMediaUrl = (path: string) => `${base}/functions/v1/studio-media?path=${encodeURIComponent(path)}`
export function privateMediaPath(value: string): string | null {
  try {
    const url = new URL(value)
    if (url.origin !== new URL(base).origin) return null
    if (url.pathname === '/functions/v1/studio-media') return url.searchParams.get('path')
    const match = url.pathname.match(/^\/storage\/v1\/object\/(?:sign|authenticated)\/ebg-studio-private\/(.+)$/)
    return match ? decodeURIComponent(match[1]) : null
  } catch { return null }
}
export function canonicalMedia<T>(value: T): T {
  if (typeof value === 'string') { const path = privateMediaPath(value); return (path ? privateMediaUrl(path) : value) as T }
  if (Array.isArray(value)) return value.map(canonicalMedia) as T
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key,item]) => [key,canonicalMedia(item)])) as T
  return value
}
export async function previewMedia<T>(value: T, token: string): Promise<T> {
  const cache = new Map<string,Promise<string>>()
  async function visit(item: unknown): Promise<unknown> {
    if (typeof item === 'string') {
      const path = privateMediaPath(item)
      if (!path) return item
      if (!cache.has(path)) cache.set(path,storage.sign(PRIVATE_MEDIA_BUCKET,path,token).catch(() => privateMediaUrl(path)))
      return cache.get(path)
    }
    if (Array.isArray(item)) return Promise.all(item.map(visit))
    if (item && typeof item === 'object') return Object.fromEntries(await Promise.all(Object.entries(item).map(async ([key,val]) => [key,await visit(val)])))
    return item
  }
  return await visit(value) as T
}
export async function uploadPrivateMedia(file: File,path: string,token: string) {
  await storage.uploadPublic(PRIVATE_MEDIA_BUCKET,path,file,token)
  return storage.sign(PRIVATE_MEDIA_BUCKET,path,token)
}
