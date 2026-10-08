import { useEffect, useState } from 'react'
import { db } from '../../src/lib/supabase'
import PublicMusicRelease from './PublicMusicRelease'
export default function StreamingRelease({ slug }: {slug:string}) {
  const [id,setId]=useState(''),[loaded,setLoaded]=useState(false),[error,setError]=useState('')
  useEffect(()=>{let active=true;setLoaded(false);setId('');setError('');db.select<{public_id:string}>('studio_streaming_links',`select=public_id&slug=eq.${encodeURIComponent(slug)}&limit=1`).then(rows=>{if(active){setId(rows[0]?.public_id||'');setLoaded(true)}}).catch(()=>{if(active){setError('This streaming link could not be loaded. Please try again.');setLoaded(true)}});return()=>{active=false}},[slug])
  return id?<PublicMusicRelease id={id}/>:<main className="public-release"><h1>{error||(!loaded?'Loading streaming link…':'This streaming link is not available.')}</h1><a href="https://ebgplus.app/app/music">Explore EBG+ Music</a></main>
}
