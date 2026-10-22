import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { updatePublicIdentity, usernameAvailable } from '../lib/auth'

export default function AccountIdentitySettings({ username, displayName, onSaved }: {
  username: string
  displayName: string
  onSaved: (value: { username: string; display_name: string }) => void
}) {
  const [handle, setHandle] = useState(username)
  const [name, setName] = useState(displayName)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  useEffect(() => { setHandle(username); setName(displayName) }, [username, displayName])

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalized = handle.trim().toLowerCase().replace(/^@/, '')
    if (!/^[a-z][a-z0-9_]{2,23}$/.test(normalized)) return setMessage('Use 3–24 letters, numbers, or underscores; start with a letter.')
    if (!name.trim() || name.trim().length > 80) return setMessage('Display name must be 1–80 characters.')
    setSaving(true)
    setMessage('')
    try {
      if (normalized !== username && !(await usernameAvailable(normalized))) throw new Error('That username is taken.')
      const updated = await updatePublicIdentity(normalized, name.trim())
      onSaved(updated)
      setMessage('Your public name and username are saved.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save your identity.')
    } finally { setSaving(false) }
  }

  return <form className="panel account-identity-settings" onSubmit={event => void save(event)}>
    <h2>Public identity</h2>
    <p>Your display name appears on your posts. Your @username is unique across EBG+.</p>
    <label>Display name<input value={name} maxLength={80} required onChange={event => setName(event.target.value)} /></label>
    <label>Username<input value={handle} maxLength={24} required autoCapitalize="none" autoComplete="username" spellCheck={false} onChange={event => setHandle(event.target.value.toLowerCase().replace(/^@/, ''))} /></label>
    <small>3–24 letters, numbers, or underscores. Start with a letter.</small>
    <button className="btn" disabled={saving || (handle === username && name === displayName)}>{saving ? 'Saving…' : 'Save public identity'}</button>
    {message && <p role="status">{message}</p>}
  </form>
}
