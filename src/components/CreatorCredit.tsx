import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import { db } from '../lib/supabase'
import './creatorCredit.css'

export type PublicCredit = {
  content_type: 'show' | 'release'
  content_id: string
  creator_name: string
  studio_name: string | null
  verified: boolean
  badge_tone: 'blue' | 'violet' | 'gold' | 'green'
}

export type CreditMap = Record<string, PublicCredit>

export async function loadPublicCredits(): Promise<CreditMap> {
  const credits = await db.rpc<PublicCredit[]>('public_content_credits')
  return Object.fromEntries(credits.map(credit => [`${credit.content_type}:${credit.content_id}`, credit]))
}

const CreditsContext = createContext<CreditMap>({})

export function CreditsProvider({ credits, children }: { credits: CreditMap; children: ReactNode }) {
  return <CreditsContext.Provider value={credits}>{children}</CreditsContext.Provider>
}

export function CreatorCredit({ kind, id, fallback }: { kind: PublicCredit['content_type']; id: string; fallback?: string }) {
  const credit = useContext(CreditsContext)[`${kind}:${id}`]
  const name = credit?.creator_name?.trim() || fallback
  if (!name) return null
  return (
    <span className="creator-credit" aria-label={`${name}${credit?.verified ? ', verified creator' : ''}${credit?.studio_name ? `, ${credit.studio_name}` : ''}`}>
      <span className="creator-credit-name">{name}</span>
      {credit?.verified && <svg className={`creator-credit-badge ${['blue', 'violet', 'gold', 'green'].includes(credit.badge_tone) ? credit.badge_tone : 'blue'}`} viewBox="0 0 24 24" role="img" aria-label="Verified" focusable="false"><path d="m12 1.7 2.2 2.1 3.1-.3.7 3 2.8 1.4-1 2.9 1 2.9-2.8 1.4-.7 3-3.1-.3-2.2 2.1-2.2-2.1-3.1.3-.7-3-2.8-1.4 1-2.9-1-2.9L6 6.5l.7-3 3.1.3z"/><path d="m8.3 11.4 2.5 2.5 5-5" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      {credit?.studio_name && credit.studio_name !== name && <span className="creator-credit-studio"> · {credit.studio_name}</span>}
    </span>
  )
}
