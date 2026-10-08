import assert from 'node:assert/strict'
import { isPublishedMedia,validMediaPath } from '../supabase/functions/studio-media/publication.ts'
const origin='https://project.supabase.co', path='studio/user/project/audio/song.mp3'
const url=origin+'/functions/v1/studio-media?path='+encodeURIComponent(path)
const music={releases:[{id:'r',artistId:'a',publishStatus:'draft'}],tracks:[{id:'t',releaseId:'r',audioUrl:url}],artists:[],videos:[]}
assert.equal(isPublishedMedia({music},path,origin),false)
music.releases[0].publishStatus='scheduled'; music.releases[0].releaseDate='2099-01-01'
assert.equal(isPublishedMedia({music},path,origin),false)
music.releases[0].releaseDate='2000-01-01'
assert.equal(isPublishedMedia({music},path,origin),true)
music.releases[0].publishStatus='archived'
assert.equal(isPublishedMedia({music},path,origin),false)
assert.equal(isPublishedMedia({episodes:[{videoUrl:url,publishStatus:'draft'}]},path,origin),false)
assert.equal(isPublishedMedia({episodes:[{videoUrl:url,publishStatus:'live'}]},path,origin),true)
assert.equal(isPublishedMedia({shows:[{description:url}]},path,origin),false)
assert.equal(isPublishedMedia({shows:[{artwork:url}]},path,origin),true)
assert.equal(isPublishedMedia({shows:[{artwork:url.replace(origin,'https://evil.test')}]},path,origin),false)
for(const bad of ['../x','studio//x','studio/../secret','other/x','studio\\x']) assert.equal(validMediaPath(bad),false)
console.log('Private media stays inaccessible for drafts, future schedules, archives, arbitrary copy, and unrelated origins; released media is authorized.')
