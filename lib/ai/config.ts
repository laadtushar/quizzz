import { GoogleGenAI } from '@google/genai'

if (!process.env.GOOGLE_AI_API_KEY) {
  throw new Error('GOOGLE_AI_API_KEY environment variable is required')
}

// Initialize Google GenAI client
// The client automatically gets the API key from GEMINI_API_KEY env var
// but we can also pass it explicitly
export const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_AI_API_KEY,
})

// Export model name for Gemini 2.5 Pro
export const model = 'gemini-2.5-pro'
