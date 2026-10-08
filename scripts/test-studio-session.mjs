import fs from 'node:fs'
import ts from 'typescript'
import vm from 'node:vm'
import assert from 'node:assert/strict'
let raw; let refreshes=0
const session={access_token:'x.'+Buffer.from(JSON.stringify({exp:1})).toString('base64url')+'.x',refresh_token:'refresh',expires_in:3600,user:{id:'owner'}}
const source=fs.readFileSync('src/lib/auth.ts','utf8').replace(/^import .*\n/,'').replaceAll('export ','')+'\n globalThis.testApi={requireFreshSession};'
const context=vm.createContext({localStorage:{getItem:()=>raw,setItem:(_,v)=>{raw=v},removeItem:()=>{raw=null}},atob,Date,Promise,JSON,Number,Error,auth:{refresh:async()=>{refreshes++;return {...session,access_token:'new-token',refresh_token:'new-refresh'}}},supabaseConfigured:true})
vm.runInContext(ts.transpile(source,{target:ts.ScriptTarget.ES2022}),context)
raw=JSON.stringify(session)
await Promise.all([context.testApi.requireFreshSession(),context.testApi.requireFreshSession()])
assert.equal(refreshes,1);assert.ok(JSON.parse(raw).expires_at>Date.now()/1000)
await context.testApi.requireFreshSession();assert.equal(refreshes,1)
raw=null;await assert.rejects(context.testApi.requireFreshSession(),/sign in again/)
console.log('Expired legacy session refresh, concurrent refresh deduplication, expiry persistence, valid session reuse and missing-session error passed.')
