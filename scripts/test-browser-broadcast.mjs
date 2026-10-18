import assert from 'node:assert/strict'
import { test } from 'node:test'

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
  let row = { key: 'cms', updated_at: '2026-10-18T23:00:00+00:00', value: { shows: [{ id: 'keep-this' }], liveTv: { channels: [{ id: 'channel', enabled: true, programs: [], broadcast: { title: '', url: '', onAir: false } }] } } }
  const requests = []
  let firstConflict = conflict
  const response = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (url, init = {}) => {
    requests.push({ url: String(url), method: init.method || 'GET', body: init.body })
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
