import { db } from './supabase'
import { readStoredSession } from './auth'

export type ViewerApplication = {
  id: string
  show_id: string
  legal_name: string
  status: string
  source: string
  created_at: string
}

export const loadMyCastingApplications = async () => {
  const session = readStoredSession()
  if (!session) throw new Error('Sign in to view your applications.')
  return db.rpc<ViewerApplication[]>('get_my_casting_applications', {}, session.access_token)
}
