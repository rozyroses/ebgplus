import { createClient } from 'jsr:@supabase/supabase-js@2.110.0'
import { isPublishedMedia, validMediaPath } from './publication.ts'
const cors = { 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Headers':'range, content-type', 'Access-Control-Allow-Methods':'GET, HEAD, OPTIONS', 'Access-Control-Expose-Headers':'Content-Length, Content-Range, Accept-Ranges' }
Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response(null,{status:204,headers:cors})
  if (!['GET','HEAD'].includes(request.method)) return new Response('Method not allowed',{status:405,headers:cors})
  const base = Deno.env.get('SUPABASE_URL') || ''
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  const path = new URL(request.url).searchParams.get('path') || ''
  if (!validMediaPath(path)) return new Response('Not found',{status:404,headers:cors})
  try {
    const admin = createClient(base,key,{auth:{persistSession:false}})
    const {data,error} = await admin.from('cms_settings').select('value').eq('key','cms').single()
    // This endpoint authorizes each resource against the current published catalog.
    // It never serves an unpublished file, even when its exact path is known.
    if (error || !data || !isPublishedMedia(data.value,path,new URL(base).origin)) return new Response('Not found',{status:404,headers:{...cors,'Cache-Control':'no-store'}})
    const headers: Record<string,string> = {Authorization:`Bearer ${key}`,apikey:key}
    const range = request.headers.get('range')
    if (range) headers.Range = range
    const upstream = await fetch(`${base}/storage/v1/object/authenticated/ebg-studio-private/${path.split('/').map(encodeURIComponent).join('/')}`,{method:request.method,headers,redirect:'manual'})
    if (![200,206,416].includes(upstream.status)) return new Response('Media unavailable',{status:404,headers:cors})
    const responseHeaders = new Headers({...cors,'Cache-Control':'public, max-age=60','X-Content-Type-Options':'nosniff','Content-Security-Policy':'sandbox'})
    for (const name of ['content-type','content-length','content-range','accept-ranges','etag','last-modified']) { const value = upstream.headers.get(name); if(value) responseHeaders.set(name,value) }
    return new Response(request.method==='HEAD'?null:upstream.body,{status:upstream.status,headers:responseHeaders})
  } catch { return new Response('Media unavailable',{status:503,headers:{...cors,'Cache-Control':'no-store'}}) }
})
