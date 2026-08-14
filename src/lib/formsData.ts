import { db } from './supabase'

export const submitPublicCastingApplication = async (application: {
  showId: string
  legalName: string
  age: number
  cityState: string
  email: string
  relationshipGoals: string
  cameraComfort: string
}) => {
  return db.rpc<{ ok: boolean; id?: string }>('submit_public_casting_application', {
    p_show_id: application.showId,
    p_legal_name: application.legalName,
    p_age: application.age,
    p_city_state: application.cityState,
    p_email: application.email,
    p_relationship_goals: application.relationshipGoals,
    p_camera_comfort: application.cameraComfort,
  })
}
