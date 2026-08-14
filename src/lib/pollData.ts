import { readStoredSession } from './auth'
import { db } from './supabase'

export type PollStatus = 'draft' | 'open' | 'closed'
export type ResultsVisibility = 'live' | 'after_close' | 'hidden'

export type Poll = {
  id: string
  show_id: string
  question: string
  description?: string | null
  status: PollStatus
  opens_at?: string | null
  closes_at?: string | null
  results_visibility: ResultsVisibility
  created_by?: string | null
  created_at: string
}

export type PollOption = {
  id: string
  poll_id: string
  label: string
  position: number
  created_at?: string
}

export type PollResult = {
  option_id: string
  label: string
  position: number
  votes: number
  percentage: number
  total_votes: number
}

const sessionToken = () => readStoredSession()?.access_token

export const loadPolls = async (showId?: string, includeDrafts = false) => {
  const filters = [
    ...(showId ? [`show_id=eq.${encodeURIComponent(showId)}`] : []),
    ...(!includeDrafts ? ['status=in.(open,closed)'] : []),
    'order=created_at.desc',
  ]
  return db.select<Poll>('polls', filters.join('&'), includeDrafts ? sessionToken() : undefined)
}

export const loadPollOptions = async (pollId: string) =>
  db.select<PollOption>('poll_options', `poll_id=eq.${encodeURIComponent(pollId)}&order=position.asc`, sessionToken())

export const loadPollResults = async (pollId: string) => {
  const rows = await db.rpc<PollResult[]>('get_poll_results', { p_poll_id: pollId }, sessionToken())
  return rows.map((row) => ({ ...row, votes: Number(row.votes), percentage: Number(row.percentage), total_votes: Number(row.total_votes) }))
}

export const voteInPoll = async (pollId: string, optionId: string) => {
  const token = sessionToken()
  if (!token) throw new Error('Sign in to EBG+ to vote.')
  return db.rpc('cast_poll_vote', { p_poll_id: pollId, p_option_id: optionId }, token)
}

export const createPoll = async (input: {
  showId: string
  question: string
  description?: string
  options: string[]
  status: PollStatus
  opensAt?: string | null
  closesAt?: string | null
  resultsVisibility: ResultsVisibility
}) => {
  const token = sessionToken()
  if (!token) throw new Error('Your EBG+ Studio session has expired.')

  const [poll] = await db.insert<Poll>('polls', {
    show_id: input.showId,
    question: input.question,
    description: input.description || null,
    status: input.status,
    opens_at: input.opensAt || null,
    closes_at: input.closesAt || null,
    results_visibility: input.resultsVisibility,
  }, token)
  if (!poll) throw new Error('Poll could not be created.')

  await db.insert<PollOption>('poll_options', input.options.map((label, position) => ({ poll_id: poll.id, label, position })), token)
  return poll
}

export const updatePoll = async (pollId: string, values: Partial<Pick<Poll, 'question' | 'description' | 'status' | 'opens_at' | 'closes_at' | 'results_visibility'>>) => {
  const token = sessionToken()
  if (!token) throw new Error('Your EBG+ Studio session has expired.')
  const [poll] = await db.update<Poll>('polls', `id=eq.${encodeURIComponent(pollId)}`, values, token)
  if (!poll) throw new Error('Poll could not be updated.')
  return poll
}

export const deletePoll = async (pollId: string) => {
  const token = sessionToken()
  if (!token) throw new Error('Your EBG+ Studio session has expired.')
  await db.remove<Poll>('polls', `id=eq.${encodeURIComponent(pollId)}`, token)
}
