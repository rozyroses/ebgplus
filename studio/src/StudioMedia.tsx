import { useEffect, useState } from 'react'
import { loadCmsData, saveCmsData, uploadStudioProjectMedia } from '../../src/lib/studioData'
type Show = { id: string; title: string; artwork?: string; banner?: string; logoImage?: string }
type Catalog = { shows: Show[]; [key: string]: unknown }
type Field = 'artwork'|'banner'|'logoImage'
export default function StudioMedia({ projectId }: { projectId: string }) {
 const [catalog,setCatalog]=useState<Catalog|null>(null),[showId,setShowId]=useState(''),[busy,setBusy]=useState(false),[notice,setNotice]=useState('')
 useEffect(()=>{let active=true;void loadCmsData<Catalog>().then(data=>{if(active){setCatalog(data);setShowId(data?.shows?.[0]?.id??'')}}).catch(e=>{if(active)setNotice(e.message)});return()=>{active=false}},[])
 const show=catalog?.shows.find(item=>item.id===showId)
 const replace=async(field:Field,file?:File)=>{
  if(!show||busy)return
  if(!file&&!window.confirm(`Remove this ${field==='artwork'?'poster':field==='logoImage'?'logo':'banner'} from ${show.title}?`))return
  setBusy(true);setNotice('')
  try{
   if(file&&(!file.type.startsWith('image/')||file.size>15*1024*1024))throw Error('Choose an image smaller than 15 MB.')
   const url=file?await uploadStudioProjectMedia(file,projectId,`brand/${show.id}`):''
   const latest=await loadCmsData<Catalog>()
   if(!latest?.shows.some(item=>item.id===show.id))throw Error('This show no longer exists. Reload Media.')
   const next={...latest,shows:latest.shows.map(item=>item.id===show.id?{...item,[field]:url}:item)}
   await saveCmsData(next);setCatalog(next);setNotice(file?'Image updated on EBG+.':'Image removed from this show.')
  }catch(e){setNotice(e instanceof Error?e.message:'Could not update media.')}
  finally{setBusy(false)}
 }
 return <section className="panel"><h2>Show media</h2><p>Manage posters, banners, and logos in the shared EBG+ show catalog.</p><label>Show / title<select disabled={busy||!catalog} value={showId} onChange={e=>setShowId(e.target.value)}>{catalog?.shows.map(item=><option key={item.id} value={item.id}>{item.title}</option>)}</select></label>{notice&&<p role="status">{notice}</p>}{!catalog&&!notice&&<p>Loading shows…</p>}{catalog&&!catalog.shows.length&&<p>No shows yet. Create one in Series first.</p>}{show&&<div className="media-grid">{([['artwork','Poster'],['banner','Banner'],['logoImage','Logo']] as const).map(([field,label])=><article className={`media-card ${field==='banner'?'wide':''}`} key={field}><h3>{label}</h3><div className="media-preview">{show[field]?<img src={show[field]} alt={`${show.title} ${label}`}/>:<p>No {label.toLowerCase()} uploaded</p>}</div><label className="button secondary">{busy?'Saving…':'Upload / replace'}<input type="file" accept="image/*" disabled={busy} onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file)void replace(field,file)}}/></label><button className="button secondary" disabled={busy||!show[field]} onClick={()=>void replace(field)}>Remove</button></article>)}</div>}</section>
}
