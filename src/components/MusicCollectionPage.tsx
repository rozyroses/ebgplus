import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { buildMusicLibrary } from '../lib/musicCatalog'
import type { CassetteTone } from '../lib/musicCollectionData'
import { CollectionStatus, useMusicCollection } from './MusicCollectionContext'
import { EbgAudioPlayer, playMusicAlbum } from './MusicPlayer'
import VinylLibrary from './VinylLibrary'

const tones: CassetteTone[] = ['lavender','rose','sage','blue','honey']
function TonePicker({ tone, change }: { tone: CassetteTone; change: (tone: CassetteTone) => void }) {
  return <label>Cassette color<select value={tone} onChange={event => change(event.target.value as CassetteTone)}>{tones.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
}
function deviceFavorites(): string[] {
  try { const value=JSON.parse(localStorage.getItem('ebg.music.favorites.v1') || '[]'); return Array.isArray(value) ? value.filter(item => typeof item==='string' && item.length>0 && item.length<=500).slice(0,500) : [] } catch { return [] }
}
export default function MusicCollectionPage({ music }: { music: Record<string,any> }) {
  const collection=useMusicCollection()
  const [creating,setCreating]=useState(false)
  const [name,setName]=useState('')
  const [tone,setTone]=useState<CassetteTone>('lavender')
  const [selected,setSelected]=useState('')
  const [renaming,setRenaming]=useState(false)
  const [editName,setEditName]=useState('')
  const [editTone,setEditTone]=useState<CassetteTone>('lavender')
  const [query,setQuery]=useState('')
  const [legacy,setLegacy]=useState(deviceFavorites)
  const [confirmDelete,setConfirmDelete]=useState(false)
  const [notice,setNotice]=useState('')
  const { albums,tracks }=buildMusicLibrary(music)
  const trackById=new Map(tracks.map(track => [track.id,track]))
  const playlists=collection?.rows.filter(row => row.kind==='playlist') || []
  const playlist=playlists.find(row => row.item_id===selected)
  const playlistTitle=playlist?.data.title || 'Untitled playlist'
  const ids=playlist?.data.trackIds || []
  const playlistTracks=ids.flatMap(id => { const track=trackById.get(id); return track?.sources.length ? [track] : [] })
  useEffect(() => { setEditName(playlist?.data.title || ''); setEditTone(playlist?.data.tone || 'lavender'); setRenaming(false); setConfirmDelete(false); setQuery('') },[selected,playlist?.data.title,playlist?.data.tone])
  if (!collection) return null
  const disabled=!collection.ready || collection.busy
  const favorites=collection.rows.filter(row => row.kind==='favorite').map(row => row.item_id)
  const savedIds=collection.rows.filter(row => row.kind==='album').map(row => row.item_id)
  const savedAlbums=savedIds.flatMap(id => { const album=albums.find(item => item.id===id); return album ? [album] : [] })
  const recent=collection.rows.filter(row => row.kind==='recent').flatMap(row => { const track=trackById.get(row.item_id); return track?.sources.length ? [track] : [] }).slice(0,12)
  const favoriteTracks=favorites.flatMap(id => { const track=trackById.get(id); return track?.sources.length ? [track] : [] })
  const choices=tracks.filter(track => track.sources.length && `${track.title} ${track.artist}`.toLowerCase().includes(query.trim().toLowerCase())).slice(0,30)
  const create=async (event: FormEvent) => {
    event.preventDefault()
    if (disabled || !name.trim()) return
    const id=crypto.randomUUID()
    if (await collection.act('playlist',id,'create',{title:name.trim(),tone})) { setSelected(id); setName(''); setCreating(false); setNotice('Your cassette is ready. Add some songs below.') }
  }
  const rename=async (event: FormEvent) => { event.preventDefault(); if (playlist && await collection.act('playlist',playlist.item_id,'rename',{title:editName.trim(),tone:editTone})) { setRenaming(false); setNotice('Cassette updated.') } }
  return <main className="page personal-music-collection">
    <header className="collection-page-heading"><div><p className="eyebrow">YOUR COLLECTION</p><h1>Your sound.<br /><span>Your shelf.</span></h1><p>Keep your favorite records close. Make a tape for every mood.</p></div><Link className="btn muted" to="/app/music">Browse all music</Link></header>
    <CollectionStatus />{notice && <p className="collection-notice" role="status">{notice}</p>}
    {legacy.length>0 && <div className="collection-import"><p>You have {legacy.length} favorites saved on this device. Bring them into this account’s collection.</p><button className="btn muted" type="button" disabled={disabled} onClick={async () => { if (await collection.act('favorite','device-import','import',{ids:legacy})) { try { localStorage.removeItem('ebg.music.favorites.v1') } catch {} setLegacy([]); setNotice('Device favorites imported into this account.') } }}>Import device favorites</button></div>}
    <section className="cassette-section" aria-labelledby="cassette-title"><div className="collection-section-heading"><div><p className="eyebrow">MADE BY YOU</p><h2 id="cassette-title">Your mixtapes</h2></div><button className="btn" type="button" disabled={disabled} onClick={() => setCreating(!creating)}>{creating ? 'Close' : '+ New playlist'}</button></div>
      {creating && <form className="cassette-create-form" onSubmit={create}><label>Playlist name<input autoFocus required maxLength={80} value={name} onChange={event => setName(event.target.value)} placeholder="Late night feelings" /></label><TonePicker tone={tone} change={setTone} /><button className="btn" disabled={disabled || !name.trim()}>Make cassette</button></form>}
      {playlists.length ? <div className="cassette-grid">{playlists.map(row => <button type="button" key={row.item_id} className={`cassette-card cassette-${row.data.tone || 'lavender'}`} aria-label={`Open playlist ${row.data.title}`} aria-pressed={selected===row.item_id} onClick={() => { setSelected(row.item_id); setNotice('') }}><span className="cassette-label"><span>EBG+ MIXTAPE · A</span><strong>{row.data.title}</strong><small>{row.data.trackIds?.length || 0} songs · your personal mix</small></span><span className="cassette-window" aria-hidden="true"><span /><i /><span /></span><span className="cassette-bottom" aria-hidden="true">◦ <span /> ◦</span></button>)}</div> : !collection.loading && <div className="collection-empty"><h3>Your first mixtape is waiting.</h3><p>Create a playlist, name your cassette, and fill it with songs from EBG+.</p></div>}
      {playlist && <section className="cassette-editor" aria-labelledby="cassette-editor-title"><div className="collection-section-heading"><div><p className="eyebrow">ON THIS TAPE</p><h2 id="cassette-editor-title">{playlistTitle}</h2></div><div className="cassette-editor-actions"><button className="btn" type="button" disabled={!playlistTracks.length} onClick={() => playMusicAlbum({id:'playlist:'+playlist.item_id,title:playlistTitle,cover:playlistTracks[0]?.artwork,tracks:playlistTracks})}>Play mixtape</button><button className="btn muted" type="button" disabled={disabled} onClick={() => setRenaming(!renaming)}>Edit cassette</button><button className="btn muted" type="button" onClick={() => setSelected('')}>Close tape</button></div></div>
        {renaming && <form className="cassette-create-form" onSubmit={rename}><label>Playlist name<input required maxLength={80} value={editName} onChange={event => setEditName(event.target.value)} /></label><TonePicker tone={editTone} change={setEditTone}/><button className="btn" disabled={disabled || !editName.trim()}>Save cassette</button></form>}
        {ids.length ? <ol className="cassette-tracklist">{ids.map((id,index) => { const track=trackById.get(id); return <li key={id}><div className="cassette-song"><span className="cassette-track-number">{index+1}</span><div><strong>{track?.title || 'Song currently unavailable'}</strong><small>{track?.artist || 'You can remove this song from your tape.'}</small></div></div>{track?.sources.length ? <EbgAudioPlayer track={track} queue={playlistTracks} src={track.src} /> : null}<div className="cassette-order-controls"><button type="button" disabled={disabled || index===0} aria-label={`Move ${track?.title || 'unavailable song'} up`} onClick={() => void collection.act('playlist',playlist.item_id,'move_track',{trackId:id,direction:'up'})}>Move up</button><button type="button" disabled={disabled || index===ids.length-1} aria-label={`Move ${track?.title || 'unavailable song'} down`} onClick={() => void collection.act('playlist',playlist.item_id,'move_track',{trackId:id,direction:'down'})}>Move down</button><button type="button" disabled={disabled} aria-label={`Remove ${track?.title || 'unavailable song'} from playlist`} onClick={() => void collection.act('playlist',playlist.item_id,'remove_track',{trackId:id})}>Remove</button></div></li> })}</ol> : <p className="collection-muted">This tape is blank. Choose a song below to get started.</p>}
        <div className="cassette-add-songs"><h3>Add songs</h3><label>Find a song<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search song or artist" /></label><div className="cassette-song-options">{choices.map(track => <div key={track.id}><span><strong>{track.title}</strong><small>{track.artist}</small></span><button type="button" className="btn muted" disabled={disabled || ids.includes(track.id)} aria-label={`Add ${track.title} to this playlist`} onClick={() => void collection.act('playlist',playlist.item_id,'add_track',{trackId:track.id})}>{ids.includes(track.id) ? 'Added' : '+ Add'}</button></div>)}{!choices.length && <p>No available songs match.</p>}</div><small>Showing up to 30 matches. Search to find more songs.</small></div>
        <div className="cassette-delete">{confirmDelete ? <><p>Delete “{playlistTitle}”? This removes the playlist and its song order.</p><button type="button" className="btn muted" disabled={disabled} onClick={async () => { if (await collection.act('playlist',playlist.item_id,'remove')) { setSelected(''); setNotice('Playlist deleted.') } }}>Delete this playlist</button><button type="button" className="btn muted" onClick={() => setConfirmDelete(false)}>Keep playlist</button></> : <button type="button" disabled={disabled} onClick={() => setConfirmDelete(true)}>Delete playlist</button>}</div>
      </section>}
    </section>
    <VinylLibrary albums={savedAlbums} query="" favorites={favorites} favoritesOnly={false} compact />
    {!collection.loading && !savedAlbums.length && <p className="collection-muted">Open a record in the music library and choose “Save album” to put it here.</p>}
    {savedIds.length>savedAlbums.length && <p className="collection-muted">{savedIds.length-savedAlbums.length} saved records are currently unavailable.</p>}
    <section className="collection-song-section"><div className="collection-section-heading"><h2>Favorite songs</h2><span>{favoriteTracks.length} songs</span></div>{favoriteTracks.length ? <div className="collection-song-grid">{favoriteTracks.map(track => <EbgAudioPlayer key={track.id} track={track} queue={favoriteTracks} src={track.src}/>)}</div> : <p className="collection-muted">Tap the heart in the player to save a song here.</p>}</section>
    <section className="collection-song-section"><div className="collection-section-heading"><h2>Recently played</h2></div>{recent.length ? <div className="collection-song-grid">{recent.map(track => <EbgAudioPlayer key={track.id} track={track} queue={recent} src={track.src}/>)}</div> : <p className="collection-muted">Your recent songs will appear after you start listening.</p>}</section>
  </main>
}
