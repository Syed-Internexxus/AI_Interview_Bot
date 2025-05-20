// Simple, in‑memory “database“
export interface Session {
  id: string
  interviewId: string
  questions: string[]
  turns: { role: 'ai' | 'candidate'; text: string }[]
  started: number
  durationSec: number
  finished?: number
  score?: any
}

const map = new Map<string, Session>()

export const InMemoryDB = {
  create(s: Session) {
    map.set(s.id, s)
    return s
  },
  get(id: string) {
    return map.get(id)
  },
  addTurn(id: string, role: 'ai' | 'candidate', text: string) {
    const sess = map.get(id)
    if (sess) sess.turns.push({ role, text })
  },
}
