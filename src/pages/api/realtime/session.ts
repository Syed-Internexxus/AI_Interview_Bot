// pages/api/realtime/session.ts
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method not allowed. Please use POST.' })
  }

  const API_KEY = process.env.AZURE_OPENAI_API_KEY!
  const ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT!           // e.g. https://my-resource.openai.azure.com
  const VERSION = process.env.OPENAI_API_VERSION!              // must be "2025-04-01-preview"
  const DEPLOY = process.env.AZURE_OPENAI_DEPLOYMENT_NAME!    // e.g. "gpt-4o-realtime-preview"
  const VOICE = process.env.AZURE_OPENAI_VOICE || 'verse'

  // 🔑 Sessions URL for minting an ephemeral key
  const url = `${ENDPOINT.replace(/\/$/, '')}` +
              `/openai/realtimeapi/sessions?api-version=${VERSION}`

  console.log('[session.ts] POST →', url, { model: DEPLOY, voice: VOICE })

  try {
    const azureRes = await fetch(url, {
      method: 'POST',
      headers: {
        'api-key': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: DEPLOY,   // deployment goes here, not in the query string
        voice: VOICE,
        // Explicitly set audio format to ensure compatibility
        output_audio_format: "pcm16",
        // Make sure these settings are configured for the audio response
        modalities: ["audio", "text"],
        // Add options for better audio quality and turn detection
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          silence_duration_ms: 400,  // More wait time before AI responds
          prefix_padding_ms: 300,
          create_response: true,
          interrupt_response: true
        },
        // Adjust these parameters if needed
        temperature: 0.7
      })
    })

    const text = await azureRes.text()
    if (!azureRes.ok) {
      console.error('[session.ts] Azure error', azureRes.status, text)
      return res.status(azureRes.status).json({ error: text })
    }

    const payload = JSON.parse(text)
    console.log('[session.ts] Session created:', payload.id, 'with model:', payload.model)
    
    // Log full payload in development for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('[session.ts] Full session payload:', JSON.stringify(payload, null, 2))
    }
    
    return res.status(200).json(payload)
  } catch (error) {
    console.error('[session.ts] Unexpected error:', error)
    return res.status(500).json({ error: 'Internal server error during session creation' })
  }
}