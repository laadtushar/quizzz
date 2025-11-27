import { NextRequest, NextResponse } from 'next/server'
import { model } from '@/lib/ai/config'
import { generate } from '@genkit-ai/ai'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing AI connection...')
    console.log('Model:', model)
    console.log('API Key exists:', !!process.env.GOOGLE_AI_API_KEY)
    
    const testPrompt = 'Say "Hello, this is a test" in JSON format: {"message": "your message here"}'
    
    console.log('Calling generate function...')
    const response = await generate({
      model,
      prompt: testPrompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 100,
      },
    })
    
    console.log('Response type:', typeof response)
    console.log('Response:', response)
    
    let text: string
    if (typeof response === 'string') {
      text = response
    } else if (response && typeof response === 'object') {
      if ('text' in response && typeof response.text === 'function') {
        text = await response.text()
      } else if ('text' in response && typeof response.text === 'string') {
        text = response.text
      } else if ('content' in response) {
        text = typeof response.content === 'string' ? response.content : JSON.stringify(response.content)
      } else {
        text = JSON.stringify(response)
      }
    } else {
      text = String(response)
    }
    
    return NextResponse.json({
      success: true,
      response: text,
      responseType: typeof response,
    })
  } catch (error) {
    console.error('Test error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

