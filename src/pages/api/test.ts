// pages/api/test.ts
import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ 
    message: 'API test endpoint is working',
    method: req.method,
    timestamp: new Date().toISOString()
  })
}   