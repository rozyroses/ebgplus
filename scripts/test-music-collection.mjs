import assert from 'node:assert/strict'
import { buildMusicLibrary } from '../src/lib/musicCatalog.ts'

const music={ artists:[{id:'artist',name:'Artist'}], releases:[
  {id:'live',title:'Published album',artistId:'artist',publishStatus:'live'},
  {id:'past',title:'Scheduled album',artistId:'artist',publishStatus:'scheduled',releaseDate:'2026-01-01'},
  {id:'future',title:'Future album',publishStatus:'scheduled',releaseDate:'2027-01-01'},
  {id:'draft',title:'Draft album',publishStatus:'draft'},
], tracks:[
  {id:'two',releaseId:'live',trackNumber:2,title:'Second',audioUrl:'/two.mp3'},
  {id:'one',releaseId:'live',trackNumber:1,title:'First',audioUrl:'/one.mp3'},
  {id:'hidden',releaseId:'draft',audioUrl:'/hidden.mp3'},
  {id:'unreleased',releaseId:'future',audioUrl:'/unreleased.mp3'},
  {id:'standalone',title:'Standalone',artistId:'artist',audioUrl:'/standalone.mp3'},
] }
const {albums,tracks}=buildMusicLibrary(music,Date.parse('2026-11-25'))
assert.deepEqual(albums.map(album=>album.id),['live','past','track:standalone'])
assert.deepEqual(albums[0].tracks.map(track=>track.id),['one','two'])
assert.equal(albums[0].tracks[0].artist,'Artist','Tracks inherit release artist metadata')
assert.deepEqual(tracks.map(track=>track.id),['one','two','standalone'])
assert.equal(tracks.some(track=>track.id==='hidden'||track.id==='unreleased'),false,'Playlists resolve only the published catalog')
const savedIds=['hidden','one','removed','standalone']
const available=new Map(tracks.map(track=>[track.id,track]))
assert.deepEqual(savedIds.flatMap(id=>available.has(id)?[available.get(id).id]:[]),['one','standalone'],'Saved references must not restore removed or unpublished audio')
assert.deepEqual(buildMusicLibrary({}).albums,[])
console.log('Music collection catalog: publication boundaries, album order, standalone songs, inherited artists, and unavailable references passed.')
