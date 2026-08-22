import { db } from './supabase'
import { readStoredSession } from './auth'

export type EbgFormQuestion = {
  id: string
  form_id: string
  label: string
  key: string
  type: 'text' | 'email' | 'number' | 'textarea' | 'select'
  required: boolean
  position: number
  options: string[] | null
  placeholder: string | null
}

export type EbgForm = {
  id: string
  slug: string
  title: string
  eyebrow: string
  description: string
  status: 'draft' | 'open' | 'closed'
  submit_message: string
  created_at: string
  questions?: EbgFormQuestion[]
}

export type EbgFormSubmission = {
  id: string
  form_id: string
  respondent_email: string | null
  status: 'new' | 'reviewing' | 'contacted' | 'accepted' | 'declined'
  internal_notes: string
  answers: Record<string, string | number | boolean | null>
  created_at: string
}

const sessionToken = () => {
  const session = readStoredSession()
  if (!session) throw new Error('Sign in with an EBG staff account to manage forms.')
  return session.access_token
}

export const loadPublicForms = async () => {
  return db.select<EbgForm>('ebg_forms', 'status=eq.open&order=created_at.desc')
}

export const loadPublicForm = async (slug: string) => {
  const [form] = await db.select<EbgForm>('ebg_forms', `slug=eq.${encodeURIComponent(slug)}&status=eq.open&limit=1`)
  if (!form) return null
  const questions = await db.select<EbgFormQuestion>('ebg_form_questions', `form_id=eq.${encodeURIComponent(form.id)}&order=position.asc`)
  return { ...form, questions }
}

export const submitEbgForm = async (formId: string, answers: Record<string, unknown>, respondentEmail?: string) => {
  return db.rpc<{ ok: boolean; id: string }>('submit_ebg_form', {
    p_form_id: formId,
    p_answers: answers,
    p_respondent_email: respondentEmail || null,
  })
}

export const loadStaffForms = async () => {
  const token = sessionToken()
  const forms = await db.select<EbgForm>('ebg_forms', 'order=created_at.desc', token)
  const questions = await db.select<EbgFormQuestion>('ebg_form_questions', 'order=position.asc', token)
  return forms.map((form) => ({ ...form, questions: questions.filter((question) => question.form_id === form.id) }))
}

export const loadStaffSubmissions = async (formId?: string) => {
  const token = sessionToken()
  const query = `${formId ? `form_id=eq.${encodeURIComponent(formId)}&` : ''}order=created_at.desc`
  return db.select<EbgFormSubmission>('ebg_form_submissions', query, token)
}

export const updateSubmission = async (id: string, patch: Pick<Partial<EbgFormSubmission>, 'status' | 'internal_notes'>) => {
  const token = sessionToken()
  const [submission] = await db.update<EbgFormSubmission>('ebg_form_submissions', `id=eq.${encodeURIComponent(id)}`, patch, token)
  if (!submission) throw new Error('Submission could not be updated.')
  return submission
}

export const updateFormStatus = async (id: string, status: EbgForm['status']) => {
  const token = sessionToken()
  const [form] = await db.update<EbgForm>('ebg_forms', `id=eq.${encodeURIComponent(id)}`, { status }, token)
  if (!form) throw new Error('Form could not be updated.')
  return form
}
