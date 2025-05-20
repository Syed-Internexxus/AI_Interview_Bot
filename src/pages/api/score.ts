// pages/api/score.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { openai } from '@/lib/azureOpenAI'     // ← central Azure client
import { InMemoryDB } from '@/lib/InMemory'

export default async function handler (
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') return res.status(405).end()

  const { sessionId } = req.body
  const session = InMemoryDB.get(sessionId)
  if (!session) return res.status(404).end()

  /* ---------- rubric prompt ---------- */
  const rubric = `
  You are an interviewer.  For each candidate answer, score:



    • clarity   1‑5
    • depth     1‑5
    • correctness 1‑5
  Respond **only** as valid JSON array, e.g.
  [
    { "questionIdx": 0, "clarity": 4, "depth": 3, "correctness": 5, "notes": "…" },
    …
  ]
  `

  /* ---------- GPT‑4o call (Azure deployment) ---------- */
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: rubric },
      { role: 'user',   content: JSON.stringify(session.turns) }
    ]
  })

  /* ---------- store & return ---------- */
  session.finished = Date.now()
  session.score = completion.choices[0].message.content   // JSON string

  res.status(200).json({ score: session.score })

}