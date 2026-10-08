import { useEffect, useState } from 'react'
import { db } from '../../src/lib/supabase'
import PublicMusicRelease from './PublicMusicRelease'
export default function StreamingRelease({ slug }: {slug:string}) {
  const [id,setId]=useState(''),[loaded,setLoaded]=useState(false),[error,setError]=useState('')
  useEffect(()=>{document.title=slug?'Listen on EBG+':'EBG+ streaming links'},[slug])
  useEffect(()=>{let active=true;setLoaded(false);setId('');setError('');if(!slug){setLoaded(true);return()=>{active=false}}db.select<{public_id:string}>('studio_streaming_links',`select=public_id&slug=eq.${encodeURIComponent(slug)}&limit=1`).then(rows=>{if(active){setId(rows[0]?.public_id||'');setLoaded(true)}}).catch(()=>{if(active){setError('This streaming link could not be loaded. Please try again.');setLoaded(true)}});return()=>{active=false}},[slug])
  if(!slug) return <main className="public-release"><a className="public-release-brand" href="https://ebgplus.app">EBG+</a><h1>One release. Every destination.</h1><p>Your music, wherever you listen. Open an artist’s streaming link to play on EBG+ or choose another platform.</p><div className="public-release-platforms"><a href="https://ebgplus.app/app/music">Explore EBG+ Music ↗</a><a href="https://studio.ebgplus.app/#music">Create a streaming link ↗</a></div></main>
  return id?<PublicMusicRelease id={id}/>:<main className="public-release"><h1>{error||(!loaded?'Loading streaming link…':'This streaming link is not available.')}</h1><a href="https://ebgplus.app/app/music">Explore EBG+ Music</a></main>
}
