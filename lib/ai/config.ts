import { googleAI } from '@genkit-ai/googleai'

if (!process.env.GOOGLE_AI_API_KEY) {
  throw new Error('GOOGLE_AI_API_KEY environment variable is required')
}

// Configure Google AI with API key
export const model = googleAI('gemini-1.5-pro', {
  apiKey: process.env.GOOGLE_AI_API_KEY,
})

