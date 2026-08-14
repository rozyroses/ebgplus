import { readStoredSession } from './auth'
import { db } from './supabase'

export type PollStatus = 'draft' | 'open' | 'closed'
export type PollResultsVisibility = 'live' | 'after_close' | 'hidden'

export type Poll = {
  id: string
  show_id: string
  question: string
  description: string | null
  status: PollStatus
  opens_at: string | null
  closes_at: string | null
  results_visibility: PollResultsVisibility
  created_at: string
}

export type PollOption = {
  id: string
  poll_id: string
  label: string
  position: number
}

export type PollResult = {
  option_id: string
  label: string
  position: number
  votes: number
  percentage: number
  total_votes: number
}

const token = () => readStoredSession()?.access_token

export const listHeartspellPolls = async () => {
  return db.select<Poll>('polls', 'show_id=eq.heartspell-house&order=created_at.desc', token())
}

export const listPublicHeartspellPolls = async () => {
  return db.select<Poll>('polls', 'show_id=eq.heartspell-house&status=in.(open,closed)&order=created_at.desc')
}

export const listPollOptions = async (pollId: string) => {
  return db.select<PollOption>('poll_options', `poll_id=eq.${encodeURIComponent(pollId)}&order=position.asc`)
}

export const getPollResults = async (pollId: string) => {
  return db.rpc<PollResult[]>('get_poll_results', { p_poll_id: pollId }, token())
}

export const castPollVote = async (pollId: string, optionId: string) => {
  const session = readStoredSession()
  if (!session) throw new Error('Sign in to EBG+ to vote.')
  return db.rpc<{ poll_id: string; option_id: string }[]>('cast_poll_vote', {
    p_poll_id: pollId,
    p_option_id: optionId,
  }, session.access_token)
}

export const createPoll = async (input: {
  question: string
  description?: string
  opensAt?: string
  closesAt?: string
  resultsVisibility: PollResultsVisibility
  options: string[]
}) => {
  const session = readStoredSession()
  if (!session) throw new Error('Your EBG+ session has expired.')
  const [poll] = await db.insert<Poll>('polls', {
    show_id: 'heartspell-house',
    question: input.question,
    description: input.description || null,
    status: 'draft',
    opens_at: input.opensAt || null,
    closes_at: input.closesAt || null,
    results_visibility: input.resultsVisibility,
  }, session.access_token)
  if (!poll) throw new Error('Poll could not be created.')

  await db.insert<PollOption>('poll_options', input.options.map((label, position) => ({
    poll_id: poll.id,
    label,
    position,
  })), session.access_token)
  return poll
}

export const updatePollStatus = async (pollId: string, status: PollStatus) => {
  const session = readStoredSession()
  if (!session) throw new Error('Your EBG+ session has expired.')
  const [poll] = await db.update<Poll>('polls', `id=eq.${encodeURIComponent(pollId)}`, { status }, session.access_token)
  if (!poll) throw new Error('Poll could not be updated.')
  return poll
}

export const deletePoll = async (pollId: string) => {
  const session = readStoredSession()
  if (!session) throw new Error('Your EBG+ session has expired.')
  await db.remove<Poll>('polls', `id=eq.${encodeURIComponent(pollId)}`, session.access_token)
}
