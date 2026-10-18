import assert from 'node:assert/strict'
import { test } from 'node:test'
import { liveTvFingerprint } from '../src/lib/liveTv.ts'

let sequence = 0
const inputId = 'a'.repeat(32)
const otherInput = 'b'.repeat(32)
async function fixture({ configured = true, role = 'founder', valid = true, owner = 'user', conflict = false } = {}) {
  let handler
  const vars = { SUPABASE_URL: 'https://db.test', SUPABASE_SERVICE_ROLE_KEY: 'server-only', ...(configured ? { CLOUDFLARE_ACCOUNT_ID: 'account', CLOUDFLARE_STREAM_API_TOKEN: 'provider-only' } : {}) }
  globalThis.Deno = { env: { get: key => vars[key] }, serve: value => { handler = value } }
  const fixtureId = sequence
  sequence += 1
  await import(`../supabase/functions/browser-broadcast/index.ts?test=${fixtureId}`)
  let row = { key: 'cms', updated_at: '2026-10-18T23:00:00+00:00', value: { shows: [{ id: 'keep-this' }], liveTv: { channels: [{ id: 'channel', name: 'EBG+ Main', description: '', enabled: true, programs: [], broadcast: { title: '', url: '', onAir: false } }] } } }
  const requests = []
  let firstConflict = conflict
  const response = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (url, init = {}) => {
    requests.push({ url: String(url), method: init.method || 'GET', body: init.body, headers: init.headers })
    if (String(url).includes('/auth/v1/user')) return response(valid ? { id: 'user' } : { error: 'invalid' }, valid ? 200 : 401)
    if (String(url).includes('/rest/v1/accounts')) return response([{ role }])
    if (String(url).includes('/rest/v1/cms_settings')) {
      if (init.method === 'PATCH') {
        if (firstConflict) { firstConflict = false; row.value.otherEdit = 'preserved'; row.updated_at = 'new-version'; return response([]) }
        row = { ...row, ...JSON.parse(init.body) }; return response([row])
      }
      return response([row])
    }
    if (String(url).startsWith('https://api.cloudflare.com/')) return response({ success: true, result: { uid: inputId, meta: { ebgAccountId: owner, ebgChannelId: 'channel' }, webRTC: { url: 'https://customer-example.cloudflarestream.com/publish-secret/webRTC/publish' }, webRTCPlayback: { url: `https://customer-example.cloudflarestream.com/${inputId}/webRTC/play` } } })
    throw new Error('Unexpected request: ' + url)
  }
  return {
    call: (action, values = {}, auth = true) => handler(new Request('https://db.test/functions/v1/browser-broadcast', { method: 'POST', headers: { Origin: 'https://ebgplus.app', 'Content-Type': 'application/json', ...(auth ? { Authorization: 'Bearer user-token' } : {}) }, body: JSON.stringify({ action, ...values }) })),
    row: () => row, requests, cleanup: () => { globalThis.fetch = originalFetch },
  }
}

test('rejects anonymous, invalid, and non-admin users before contacting the provider', async () => {
  for (const args of [{ valid: false }, { role: 'viewer' }, { role: 'producer' }]) {
    const f = await fixture(args)
    try { assert.equal((await f.call('create', { channelId: 'channel' })).status, args.valid === false ? 401 : 403); assert.ok(!f.requests.some(r => r.url.includes('api.cloudflare.com'))) } finally { f.cleanup() }
  }
  const f = await fixture()
  try { assert.equal((await f.call('status', {}, false)).status, 401); assert.equal(f.requests.length, 0) } finally { f.cleanup() }
})
test('missing provider setup permits status but cannot create a public broadcast', async () => {
  const f = await fixture({ configured: false })
  try { assert.deepEqual(await (await f.call('status')).json(), { configured: false }); assert.equal((await f.call('create', { channelId: 'channel' })).status, 503); assert.ok(!f.requests.some(r => r.url.includes('api.cloudflare.com'))) } finally { f.cleanup() }
})
test('provisions a private publisher connection without making the channel live', async () => {
  const f = await fixture()
  try { const result = await (await f.call('create', { channelId: 'channel' })).json(); assert.equal(result.inputId, inputId); assert.ok(result.publishUrl.includes('publish-secret')); assert.equal(f.row().value.liveTv.channels[0].broadcast.onAir, false); assert.ok(!JSON.stringify(f.row()).includes('publish-secret')) } finally { f.cleanup() }
})
test('activation stores only the public viewer URL and a short heartbeat lease', async () => {
  const f = await fixture({ conflict: true })
  try {
    assert.equal((await f.call('activate', { channelId: 'channel', inputId, title: 'Live with Bijou' })).status, 200)
    const broadcast = f.row().value.liveTv.channels[0].broadcast
    assert.equal(broadcast.protocol, 'webrtc'); assert.equal(broadcast.onAir, true); assert.equal(broadcast.title, 'Live with Bijou')
    assert.ok(broadcast.url.endsWith('/webRTC/play')); assert.ok(!JSON.stringify(f.row()).includes('publish-secret'))
    assert.ok(Date.parse(broadcast.endsAt) > Date.now()); assert.ok(Date.parse(broadcast.endsAt) <= Date.now() + 90000)
    assert.equal(f.row().value.otherEdit, 'preserved'); assert.deepEqual(f.row().value.shows, [{ id: 'keep-this' }])
  } finally { f.cleanup() }
})
test('input ownership is checked and heartbeat cannot replace a different session', async () => {
  const f = await fixture({ owner: 'someone-else' })
  try { assert.equal((await f.call('activate', { channelId: 'channel', inputId })).status, 403); assert.equal(f.row().value.liveTv.channels[0].broadcast.onAir, false) } finally { f.cleanup() }
  const g = await fixture()
  try { g.row().value.liveTv.channels[0].broadcast.providerInputId = otherInput; assert.equal((await g.call('heartbeat', { channelId: 'channel', inputId })).status, 409) } finally { g.cleanup() }
  const stopped = await fixture()
  try { stopped.row().value.liveTv.channels[0].broadcast.providerInputId = inputId; assert.equal((await stopped.call('heartbeat', { channelId: 'channel', inputId })).status, 409) } finally { stopped.cleanup() }
})
test('stopping ends only its own takeover and deletes the provider input', async () => {
  const f = await fixture()
  try {
    f.row().value.liveTv.channels[0].broadcast = { title: 'Live', url: 'https://viewer.example/play', onAir: true, providerInputId: inputId }
    assert.equal((await f.call('stop', { channelId: 'channel', inputId })).status, 200)
    assert.equal(f.row().value.liveTv.channels[0].broadcast.onAir, false)
    assert.ok(f.requests.some(r => r.url.endsWith('/'+inputId) && r.method === 'DELETE'))
  } finally { f.cleanup() }
})
test('invalid actions, channel IDs, and input IDs cannot reach provider APIs', async () => {
  const f = await fixture()
  try { for (const [action, values] of [['invalid', {}], ['create', {}], ['activate', { channelId: 'channel', inputId: '../bad' }]]) assert.equal((await f.call(action, values)).status, 400); assert.ok(!f.requests.some(r => r.url.includes('api.cloudflare.com'))) } finally { f.cleanup() }
})


test('saves channel settings without provider setup or a feed using server database access', async () => {
  const f = await fixture({ configured: false, conflict: true })
  try {
    const config = structuredClone(f.row().value.liveTv)
    const expectedFingerprint = liveTvFingerprint(config)
    config.channels[0].name = 'EBG+ Originals'
    config.channels[0].broadcast = { title: 'Future broadcast', url: '  ', onAir: true }
    const result = await f.call('save-settings', { config, expectedFingerprint })
    assert.equal(result.status, 200)
    const saved = (await result.json()).liveTv
    assert.equal(saved.channels[0].name, 'EBG+ Originals')
    assert.equal(saved.channels[0].broadcast.url, '')
    assert.equal(saved.channels[0].broadcast.onAir, false)
    assert.deepEqual(saved, f.row().value.liveTv)
    assert.deepEqual(f.row().value.shows, [{ id: 'keep-this' }])
    assert.equal(f.row().value.otherEdit, 'preserved')
    const writes = f.requests.filter(r => r.method === 'PATCH')
    assert.equal(writes.length, 2)
    assert.ok(writes.every(r => r.headers.Authorization === 'Bearer server-only' && r.headers.apikey === 'server-only'))
    assert.ok(!f.requests.some(r => r.url.includes('api.cloudflare.com')))
  } finally { f.cleanup() }
})
test('stale channel settings cannot overwrite a different session', async () => {
  const f = await fixture({ configured: false })
  try {
    const config = structuredClone(f.row().value.liveTv)
    const expectedFingerprint = liveTvFingerprint(config)
    f.row().value.liveTv.channels[0].name = 'Changed elsewhere'
    config.channels[0].name = 'Stale edit'
    assert.equal((await f.call('save-settings', { config, expectedFingerprint })).status, 409)
    assert.equal(f.row().value.liveTv.channels[0].name, 'Changed elsewhere')
    assert.ok(!f.requests.some(r => r.method === 'PATCH'))
  } finally { f.cleanup() }
})
test('settings validation rejects malformed lineups and overlapping schedules before writing', async () => {
  const f = await fixture({ configured: false })
  try {
    const config = structuredClone(f.row().value.liveTv)
    const expectedFingerprint = liveTvFingerprint(config)
    const program = { id: 'p1', sourceId: 'video', sourceKind: 'episode', startsAt: '2027-01-01T12:00:00Z', durationSeconds: 60 }
    config.channels[0].programs = [program, { ...program, id: 'p2' }]
    for (const value of [null, {}, { channels: [null] }, config]) assert.equal((await f.call('save-settings', { config: value, expectedFingerprint })).status, 400)
    assert.ok(!f.requests.some(r => r.method === 'PATCH'))
  } finally { f.cleanup() }
})
test('anonymous and non-admin accounts cannot save channel settings', async () => {
  for (const role of ['viewer', 'producer']) {
    const f = await fixture({ role, configured: false })
    try {
      const config = f.row().value.liveTv
      assert.equal((await f.call('save-settings', { config, expectedFingerprint: liveTvFingerprint(config) })).status, 403)
      assert.ok(!f.requests.some(r => r.method === 'PATCH'))
      assert.equal((await f.call('save-settings', {}, false)).status, 401)
    } finally { f.cleanup() }
  }
})

test('creates the first lineup when the catalog has no Live TV settings yet', async () => {
  const f = await fixture({ configured: false })
  try {
    const config = structuredClone(f.row().value.liveTv)
    delete f.row().value.liveTv
    const result = await f.call('save-settings', { config, expectedFingerprint: liveTvFingerprint({ channels: [] }) })
    assert.equal(result.status, 200)
    assert.deepEqual((await result.json()).liveTv, config)
    assert.deepEqual(f.row().value.shows, [{ id: 'keep-this' }])
  } finally { f.cleanup() }
})
