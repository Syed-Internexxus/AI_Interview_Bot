// pages/api/simple-session.ts
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const API_KEY = process.env.AZURE_OPENAI_API_KEY
  const ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT
  const VERSION = process.env.OPENAI_API_VERSION || '2024-10-01-preview'
  const DEPLOY = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o-realtime-preview'
  const VOICE = process.env.AZURE_OPENAI_VOICE || 'verse'

  try {
    const apiUrl = `${ENDPOINT}/openai/realtime/sessions?api-version=${VERSION}&deployment=${DEPLOY}`
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'api-key': API_KEY!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ voice: VOICE })
    })
    
    if (!response.ok) {
      const text = await response.text()
      return res.status(response.status).json({ error: text })
    }
    
    const data = await response.json()
    return res.status(200).json(data)
  } catch (error) {
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}