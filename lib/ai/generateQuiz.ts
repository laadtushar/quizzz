import { generate } from '@genkit-ai/ai'
import { model } from './config'
import { buildQuizGenerationPrompt } from './prompts'
import { validateAIResponse } from './validators'

export interface GenerateQuizParams {
  inputText: string
  questionCount: number
  difficulty: 'easy' | 'medium' | 'hard'
  questionTypes: string[]
  title?: string
  description?: string
}

export interface GeneratedQuestion {
  type: 'mcq' | 'multiple_select' | 'true_false' | 'ordering' | 'fill_blank'
  questionText: string
  points: number
  options?: Array<{ id: string; text: string; isCorrect: boolean }>
  correctAnswer: any
  explanation?: string
}

export async function generateQuiz(params: GenerateQuizParams): Promise<{
  questions: GeneratedQuestion[]
  processingTimeMs: number
}> {
  const startTime = Date.now()

  const prompt = buildQuizGenerationPrompt(
    params.inputText,
    params.questionCount,
    params.difficulty,
    params.questionTypes
  )

  try {
    const response = await generate({
      model,
      prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
    })

    // Parse JSON from response
    let parsedResponse: any
    const text = typeof response === 'string' ? response : response.text?.() || String(response)

    // Try to extract JSON from markdown code blocks if present
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/)
    const jsonText = jsonMatch ? jsonMatch[1] : text

    try {
      parsedResponse = JSON.parse(jsonText)
    } catch (parseError) {
      // Try to find JSON object in the text
      const jsonObjectMatch = text.match(/\{[\s\S]*\}/)
      if (jsonObjectMatch) {
        parsedResponse = JSON.parse(jsonObjectMatch[0])
      } else {
        throw new Error('No valid JSON found in AI response')
      }
    }

    // Validate response
    const validation = validateAIResponse(parsedResponse, params.questionCount)
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid AI response')
    }

    const processingTimeMs = Date.now() - startTime

    // Transform questions to match our schema
    const questions: GeneratedQuestion[] = validation.questions!.map((q, index) => {
      // Map type names
      let mappedType = q.type
      if (q.type === 'multiple_select') {
        mappedType = 'multiple_select'
      } else if (q.type === 'true_false') {
        mappedType = 'true_false'
      } else if (q.type === 'fill_blank') {
        mappedType = 'fill_blank'
      }

      // For MCQ and multiple-select, ensure correctAnswer matches options
      let correctAnswer = q.correctAnswer
      if (['mcq', 'multiple_select'].includes(mappedType) && q.options) {
        if (mappedType === 'mcq') {
          // Ensure correctAnswer is an optionId
          const correctOption = q.options.find((o) => o.isCorrect)
          if (correctOption) {
            correctAnswer = correctOption.id
          }
        } else if (mappedType === 'multiple_select') {
          // Ensure correctAnswer is array of optionIds
          correctAnswer = q.options.filter((o) => o.isCorrect).map((o) => o.id)
        }
      }

      // For ordering, ensure correctAnswer is array of optionIds
      if (mappedType === 'ordering' && q.options) {
        if (!Array.isArray(correctAnswer)) {
          // Use option order as default
          correctAnswer = q.options.map((o) => o.id)
        }
      }

      return {
        type: mappedType as any,
        questionText: q.questionText,
        points: q.points || 10,
        options: q.options || undefined,
        correctAnswer,
        explanation: q.explanation,
      }
    })

    return {
      questions,
      processingTimeMs,
    }
  } catch (error) {
    const processingTimeMs = Date.now() - startTime
    throw new Error(
      `AI generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

