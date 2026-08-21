import { useEffect, useMemo, useState } from 'react'
import { readStoredSession } from '../../src/lib/auth'
import { db } from '../../src/lib/supabase'

type TeamAccount = {
  id: string
  email: string | null
  role: string
  created_at?: string
}

type GlobalAccess = {
  account_id: string
  granted_by?: string | null
  created_at?: string
}

type ShowAccess = {
  show_id: string
  account_id: string
  access_role: 'owner' | 'producer' | 'editor' | 'viewer'
  granted_by?: string | null
  created_at?: string
}

type CmsSlice = {
  shows?: Array<{ id: string; title: string }>
}

const ACCESS_ROLES: ShowAccess['access_role'][] = ['owner', 'producer', 'editor', 'viewer']
const STAFF_ROLES = new Set(['editor', 'producer', 'administrator', 'founder'])
const AUTO_GLOBAL_ROLES = new Set(['administrator', 'founder'])

const isTeamTab = () => window.location.hash.replace(/^#\/?/, '') === 'team'

export default function TeamAccessPanel() {
  const [active, setActive] = useState(isTeamTab)
  const [loading, setLoading] = useState(false)
  const [globalAdmin, setGlobalAdmin] = useState<boolean | null>(null)
  const [accounts, setAccounts] = useState<TeamAccount[]>([])
  const [globalRows, setGlobalRows] = useState<GlobalAccess[]>([])
  const [showRows, setShowRows] = useState<ShowAccess[]>([])
  const [shows, setShows] = useState<Array<{ id: string; title: string }>>([])
  const [message, setMessage] = useState('')
  const [busyKey, setBusyKey] = useState('')

  useEffect(() => {
    const sync = () => setActive(isTeamTab())
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  const refresh = async () => {
    const session = readStoredSession()
    if (!session) {
      setGlobalAdmin(false)
      setMessage('Sign in to Studio to manage access.')
      return
    }

    setLoading(true)
    setMessage('')
    try {
      const isGlobal = await db.rpc<boolean>('studio_is_global', {}, session.access_token)
      setGlobalAdmin(Boolean(isGlobal))
      if (!isGlobal) return

      const [nextAccounts, nextGlobals, nextShowAccess, cms] = await Promise.all([
        db.select<TeamAccount>('accounts', 'order=created_at.asc', session.access_token),
        db.select<GlobalAccess>('studio_global_access', 'order=created_at.asc', session.access_token),
        db.select<ShowAccess>('studio_show_access', 'order=created_at.asc', session.access_token),
        db.rpc<CmsSlice | null>('studio_load_cms', {}, session.access_token),
      ])

      setAccounts(nextAccounts.filter((account) => STAFF_ROLES.has(account.role)))
      setGlobalRows(nextGlobals)
      setShowRows(nextShowAccess)
      setShows(cms?.shows ?? [])
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Team access could not be loaded.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (active) void refresh()
  }, [active])

  const explicitGlobals = useMemo(() => new Set(globalRows.map((row) => row.account_id)), [globalRows])

  const toggleGlobal = async (account: TeamAccount) => {
    if (AUTO_GLOBAL_ROLES.has(account.role)) return
    const session = readStoredSession()
    if (!session) return
    const enabled = !explicitGlobals.has(account.id)
    const key = `global:${account.id}`
    setBusyKey(key)
    setMessage('')
    try {
      await db.rpc<void>('studio_set_global_access', {
        p_account_id: account.id,
        p_enabled: enabled,
      }, session.access_token)
      await refresh()
      setMessage(`${account.email ?? 'Team member'} ${enabled ? 'now has' : 'no longer has'} global Studio access.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Global access could not be changed.')
    } finally {
      setBusyKey('')
    }
  }

  const assignShow = async (account: TeamAccount, form: HTMLFormElement) => {
    const session = readStoredSession()
    if (!session) return
    const data = new FormData(form)
    const showId = String(data.get('showId') ?? '')
    const role = String(data.get('accessRole') ?? 'editor') as ShowAccess['access_role']
    if (!showId) return
    const key = `assign:${account.id}:${showId}`
    setBusyKey(key)
    setMessage('')
    try {
      await db.rpc<void>('studio_set_show_access', {
        p_show_id: showId,
        p_account_id: account.id,
        p_access_role: role,
      }, session.access_token)
      await refresh()
      setMessage(`${account.email ?? 'Team member'} now has ${role} access to ${shows.find((show) => show.id === showId)?.title ?? showId}.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Show access could not be assigned.')
    } finally {
      setBusyKey('')
    }
  }

  const updateShowRole = async (row: ShowAccess, role: ShowAccess['access_role']) => {
    const session = readStoredSession()
    if (!session) return
    const key = `role:${row.account_id}:${row.show_id}`
    setBusyKey(key)
    setMessage('')
    try {
      await db.rpc<void>('studio_set_show_access', {
        p_show_id: row.show_id,
        p_account_id: row.account_id,
        p_access_role: role,
      }, session.access_token)
      await refresh()
      setMessage('Show role updated.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Show role could not be updated.')
    } finally {
      setBusyKey('')
    }
  }

  const removeShow = async (row: ShowAccess) => {
    const session = readStoredSession()
    if (!session) return
    const key = `remove:${row.account_id}:${row.show_id}`
    setBusyKey(key)
    setMessage('')
    try {
      await db.rpc<void>('studio_remove_show_access', {
        p_show_id: row.show_id,
        p_account_id: row.account_id,
      }, session.access_token)
      await refresh()
      setMessage('Show access removed.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Show access could not be removed.')
    } finally {
      setBusyKey('')
    }
  }

  if (!active) return null

  return (
    <section className="team-access-overlay" aria-label="Studio team access management">
      <div className="team-access-shell">
        <div className="team-access-heading">
          <div>
            <p className="eyebrow">ACCESS CONTROL</p>
            <h2>Team & show permissions</h2>
            <p>Global staff can work across the whole EBG+ slate. Everyone else can be limited to specific productions.</p>
          </div>
          <button className="button secondary" type="button" onClick={() => void refresh()} disabled={loading}>↻ Refresh</button>
        </div>

        {message && <div className="team-access-message">{message}</div>}

        {loading && globalAdmin === null ? (
          <div className="team-access-empty">Loading Studio permissions…</div>
        ) : globalAdmin === false ? (
          <div className="team-access-empty">
            <strong>Global access required</strong>
            <p>You can work inside the productions assigned to you, but only global Studio staff can manage the team.</p>
          </div>
        ) : (
          <div className="team-access-list">
            {accounts.map((account) => {
              const automaticGlobal = AUTO_GLOBAL_ROLES.has(account.role)
              const explicitGlobal = explicitGlobals.has(account.id)
              const accountShows = showRows.filter((row) => row.account_id === account.id)
              const isGlobal = automaticGlobal || explicitGlobal

              return (
                <article className="team-access-card" key={account.id}>
                  <div className="team-member-head">
                    <div className="team-member-avatar">{account.email?.slice(0, 1).toUpperCase() ?? 'E'}</div>
                    <div className="team-member-copy">
                      <strong>{account.email ?? account.id}</strong>
                      <span>{account.role}</span>
                    </div>
                    <label className={`global-toggle ${automaticGlobal ? 'locked' : ''}`}>
                      <input
                        type="checkbox"
                        checked={isGlobal}
                        disabled={automaticGlobal || busyKey === `global:${account.id}`}
                        onChange={() => void toggleGlobal(account)}
                      />
                      <span>{automaticGlobal ? 'Automatic global' : 'Global access'}</span>
                    </label>
                  </div>

                  <div className="team-show-access">
                    <div className="team-show-title">
                      <strong>Show access</strong>
                      {isGlobal && <span className="access-pill global">ALL SHOWS</span>}
                    </div>

                    {accountShows.length ? (
                      <div className="assignment-list">
                        {accountShows.map((row) => (
                          <div className="assignment-row" key={`${row.account_id}:${row.show_id}`}>
                            <div>
                              <strong>{shows.find((show) => show.id === row.show_id)?.title ?? row.show_id}</strong>
                              <span>{row.show_id}</span>
                            </div>
                            <select
                              value={row.access_role}
                              disabled={busyKey === `role:${row.account_id}:${row.show_id}`}
                              onChange={(event) => void updateShowRole(row, event.target.value as ShowAccess['access_role'])}
                            >
                              {ACCESS_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
                            </select>
                            <button
                              className="button danger compact"
                              type="button"
                              disabled={busyKey === `remove:${row.account_id}:${row.show_id}`}
                              onClick={() => void removeShow(row)}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-assignments">No production-specific assignments yet.</p>
                    )}

                    <form
                      className="assignment-form"
                      onSubmit={(event) => {
                        event.preventDefault()
                        void assignShow(account, event.currentTarget)
                      }}
                    >
                      <label>
                        Production
                        <select name="showId" defaultValue="" required>
                          <option value="" disabled>Choose a show</option>
                          {shows.map((show) => <option key={show.id} value={show.id}>{show.title}</option>)}
                        </select>
                      </label>
                      <label>
                        Role
                        <select name="accessRole" defaultValue="editor">
                          {ACCESS_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
                        </select>
                      </label>
                      <button className="button" type="submit">Assign show</button>
                    </form>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
