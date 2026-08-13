import { auth, supabaseConfigured } from './supabase'

export const requestPasswordReset = async (email: string) => {
  if (!supabaseConfigured) throw new Error('EBG+ authentication is not configured yet.')
  const redirectTo = `${window.location.origin}${import.meta.env.BASE_URL}auth/reset-password`
  await auth.requestPasswordReset(email.trim(), redirectTo)
}

export const updateRecoveredPassword = async (password: string) => {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const accessToken = params.get('access_token')
  if (!accessToken) throw new Error('This reset link is missing or expired. Request a new password reset email.')
  await auth.updatePassword(accessToken, password)
  window.history.replaceState({}, document.title, window.location.pathname)
}
