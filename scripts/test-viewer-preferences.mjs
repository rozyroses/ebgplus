import assert from 'node:assert/strict'
import { readViewerPreferences, saveViewerPreferences, defaultViewerPreferences } from '../src/lib/viewerPreferences.ts'
let stored='{}', events=0
globalThis.localStorage={getItem:()=>stored,setItem:(key,value)=>{stored=value}}
globalThis.window={dispatchEvent:()=>{events++}}
assert.deepEqual(readViewerPreferences(),defaultViewerPreferences)
stored=JSON.stringify({speed:99,volume:12,keyboard:false,reduceMotion:true,largeText:true})
assert.deepEqual(readViewerPreferences(),{speed:1,volume:1,keyboard:false,reduceMotion:true,largeText:true})
stored='{broken';assert.deepEqual(readViewerPreferences(),defaultViewerPreferences)
saveViewerPreferences({...defaultViewerPreferences,speed:1.5,volume:.4});assert.equal(readViewerPreferences().speed,1.5);assert.equal(readViewerPreferences().volume,.4);assert.equal(events,1)
console.log('Device preferences validate saved values, recover corrupt storage, persist updates, and notify connected controls.')
