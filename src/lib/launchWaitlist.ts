import { readStoredSession } from './auth'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '')
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const assertConfigured = () => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Supabase is not configured.')
}

const publicHeaders = () => ({
  apikey: SUPABASE_ANON_KEY ?? '',
  Authorization: `Bearer ${SUPABASE_ANON_KEY ?? ''}`,
  'Content-Type': 'application/json',
})

const readError = async (response: Response) => {
  const body = await response.json().catch(() => null)
  return body?.message ?? body?.error_description ?? body?.error ?? `Request failed (${response.status})`
}

export const joinLaunchWaitlist = async (email: string) => {
  assertConfigured()
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/join_launch_waitlist`, {
    method: 'POST',
    headers: publicHeaders(),
    body: JSON.stringify({ p_email: email }),
  })
  if (!response.ok) throw new Error(await readError(response))
  return response.json().catch(() => ({ ok: true }))
}

export const unsubscribeLaunchWaitlist = async (token: string) => {
  assertConfigured()
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/unsubscribe_launch_waitlist`, {
    method: 'POST',
    headers: publicHeaders(),
    body: JSON.stringify({ p_token: token }),
  })
  if (!response.ok) throw new Error(await readError(response))
  return response.json().catch(() => ({ ok: true }))
}

export type LaunchWaitlistStats = {
  total: number
  active: number
  notified: number
  unsubscribed: number
}

export const getLaunchWaitlistStats = async (): Promise<LaunchWaitlistStats> => {
  assertConfigured()
  const session = readStoredSession()
  if (!session) throw new Error('Your EBG+ session has expired. Please sign in again.')
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_launch_waitlist_stats`, {
    method: 'POST',
    headers: {
      ...publicHeaders(),
      Authorization: `Bearer ${session.access_token}`,
    },
    body: '{}',
  })
  if (!response.ok) throw new Error(await readError(response))
  return response.json()
}

export const sendLaunchAnnouncement = async () => {
  assertConfigured()
  const session = readStoredSession()
  if (!session) throw new Error('Your EBG+ session has expired. Please sign in again.')
  const response = await fetch(`${SUPABASE_URL}/functions/v1/send-launch-email`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY ?? '',
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'launch' }),
  })
  if (!response.ok) throw new Error(await readError(response))
  return response.json() as Promise<{ sent: number; remaining: number }>
}
