import assert from 'node:assert/strict'
import { reviewItems, applyPublishReview } from '../studio/src/publishingReview.ts'
const now = new Date('2026-10-07T16:00:00Z')
const cms = { privateNote: 'keep', shows: [{id:'show',title:'Show',artwork:'https://media.test/poster.jpg',homeVisible:false}], episodes: [{id:'episode',showId:'show',title:'Episode',videoUrl:'https://media.test/video.mp4',publishStatus:'draft'}], music: {artists:[{id:'artist',name:'Artist'}], releases:[{id:'release',artistId:'artist',title:'Release',publishStatus:'draft'}], tracks:[{id:'track',releaseId:'release',title:'Track',audioUrl:'https://media.test/audio.mp3',lyrics:'retain'}]} }
const music = reviewItems(cms,'music')[0]
assert.equal(music.errors.length,0)
assert.ok(music.warnings.length)
const published = applyPublishReview(cms,music,'live','',now)
assert.equal(published.music.releases[0].publishStatus,'live')
assert.equal(published.music.releases[0].publishHistory[0].at,now.toISOString())
assert.equal(published.music.tracks,cms.music.tracks)
assert.equal(published.shows,cms.shows)
assert.equal(cms.music.releases[0].publishStatus,'draft')
assert.equal(applyPublishReview({...cms,privateNote:'changed'},music,'live','',now).privateNote,'changed')
assert.throws(() => applyPublishReview({...cms,music:{...cms.music,tracks:[{...cms.music.tracks[0],lyrics:'new'}]}},music,'live','',now),/changed/)
assert.throws(() => applyPublishReview(cms,music,'scheduled','2026-10-06',now),/future/)
assert.throws(() => applyPublishReview(cms,music,'visible','',now),/valid/)
const scheduled = applyPublishReview(cms,music,'scheduled','2026-10-08T16:00:00Z',now)
assert.equal(scheduled.music.releases[0].releaseDate,'2026-10-08T16:00:00.000Z')
const episode = reviewItems(cms,'episode')[0]
assert.equal(applyPublishReview(cms,episode,'live','',now).episodes[0].releaseDate,now.toISOString())
const show = reviewItems(cms,'show')[0]
assert.equal(applyPublishReview(cms,show,'visible','',now).shows[0].homeVisible,true)
const invalid = {...cms,music:{...cms.music,tracks:[]}}
assert.throws(() => applyPublishReview(invalid,reviewItems(invalid,'music')[0],'live','',now),/audio/)
assert.equal(applyPublishReview(invalid,reviewItems(invalid,'music')[0],'draft','',now).music.releases[0].publishStatus,'draft')
const signed = token => ({...cms,music:{...cms.music,tracks:[{...cms.music.tracks[0],audioUrl:`https://project.supabase.co/storage/v1/object/sign/ebg-studio-private/studio/owner/project/audio.wav?token=${token}`}]}})
const privateReview = reviewItems(signed('first'),'music')[0]
assert.equal(applyPublishReview(signed('refreshed'),privateReview,'live','',now).music.releases[0].publishStatus,'live')
const permanent = {...cms,music:{...cms.music,tracks:[{...cms.music.tracks[0],audioUrl:'https://project.supabase.co/functions/v1/studio-media?path=studio%2Fowner%2Fproject%2Faudio.wav'}]}}
assert.equal(applyPublishReview(permanent,privateReview,'live','',now).music.releases[0].publishStatus,'live')
assert.throws(() => applyPublishReview({...permanent,music:{...permanent.music,tracks:[{...permanent.music.tracks[0],audioUrl:permanent.music.tracks[0].audioUrl.replace('audio.wav','replacement.wav')}]}},privateReview,'live','',now),/changed/)
console.log('Publishing reviews validate readiness and scheduling, retain unrelated content, record history, and reject stale reviews.')
