const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '')
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

export type SupabaseSession = {
  access_token: string
  refresh_token: string
  expires_in: number
  expires_at?: number
  token_type: string
  user: {
    id: string
    email?: string
  }
}

const headers = (token?: string) => ({
  apikey: SUPABASE_ANON_KEY ?? '',
  Authorization: `Bearer ${token ?? SUPABASE_ANON_KEY ?? ''}`,
  'Content-Type': 'application/json',
})

const request = async <T>(path: string, init: RequestInit = {}, token?: string): Promise<T> => {
  if (!supabaseConfigured) throw new Error('Supabase is not configured.')
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: { ...headers(token), ...(init.headers ?? {}) },
  })
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const message = body?.msg ?? body?.message ?? body?.error_description ?? body?.error ?? `Request failed (${response.status})`
    throw new Error(message)
  }
  return body as T
}

export const auth = {
  signUp(email: string, password: string) {
    return request<SupabaseSession | { user: SupabaseSession['user']; session: SupabaseSession | null }>(
      '/auth/v1/signup',
      { method: 'POST', body: JSON.stringify({ email, password }) },
    )
  },

  signIn(email: string, password: string) {
    return request<SupabaseSession>('/auth/v1/token?grant_type=password', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },

  refresh(refreshToken: string) {
    return request<SupabaseSession>('/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
  },

  getUser(accessToken: string) {
    return request<{ id: string; email?: string }>('/auth/v1/user', { method: 'GET' }, accessToken)
  },

  requestPasswordReset(email: string, redirectTo?: string) {
    return request<Record<string, never>>('/auth/v1/recover', {
      method: 'POST',
      body: JSON.stringify({ email, ...(redirectTo ? { redirect_to: redirectTo } : {}) }),
    })
  },

  updatePassword(accessToken: string, password: string) {
    return request<{ id: string; email?: string }>('/auth/v1/user', {
      method: 'PUT',
      body: JSON.stringify({ password }),
    }, accessToken)
  },

  signOut(accessToken: string) {
    return request<Record<string, never>>('/auth/v1/logout', { method: 'POST' }, accessToken)
  },
}

export const db = {
  async select<T>(table: string, query = '', accessToken?: string): Promise<T[]> {
    return request<T[]>(`/rest/v1/${table}?${query}`, { method: 'GET', headers: { Prefer: 'return=representation' } }, accessToken)
  },

  async insert<T>(table: string, rows: Partial<T> | Array<Partial<T>>, accessToken?: string): Promise<T[]> {
    return request<T[]>(`/rest/v1/${table}`, {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(rows),
    }, accessToken)
  },

  async update<T>(table: string, query: string, values: Partial<T>, accessToken?: string): Promise<T[]> {
    return request<T[]>(`/rest/v1/${table}?${query}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(values),
    }, accessToken)
  },

  async remove<T>(table: string, query: string, accessToken?: string): Promise<T[]> {
    return request<T[]>(`/rest/v1/${table}?${query}`, {
      method: 'DELETE',
      headers: { Prefer: 'return=representation' },
    }, accessToken)
  },
}
