import type { NextApiRequest, NextApiResponse } from 'next'

/**
 * POST { answer: "…" } → { score: 88, feedback: "…" }
 * Uses *O4-mini* chat deployment to grade the answer.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') return res.status(405).end()

  const { answer } = req.body ?? {}
  if (!answer) return res.status(400).json({ error: 'Missing `answer`' })

  const endpoint    = process.env.AOAI_ENDPOINT!
  const deployment  = process.env.AOAI_DEPLOYMENT_GRADE!
  const apiKey      = process.env.AOAI_KEY!
  const apiVersion  = '2024-02-15-preview'

  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`

  const messages = [
    {
      role: 'system',
      content:
        'You are an interview assessor. Score the candidate’s answer from 0-100 and give 1–2 sentences of constructive feedback. Respond **only** in JSON: {"score":<int>,"feedback":"<string>"}'
    },
    { role: 'user', content: answer }
  ]

  const aoaiRes = await fetch(url, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ messages, temperature: 0.2 })
  })

  if (!aoaiRes.ok) {
    console.error(await aoaiRes.text())
    return res.status(502).json({ error: 'Grading failed' })
  }

  const raw = await aoaiRes.json()
  const content = raw.choices?.[0]?.message?.content ?? '{}'

  let parsed
  try {
    parsed = JSON.parse(content)
  } catch (err) {
    console.error('JSON parse error:', content)
    return res.status(500).json({ error: 'Invalid grader response' })
  }

  return res.status(200).json(parsed)
}
