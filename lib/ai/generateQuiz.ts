import { ai, model } from './config'
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
  title?: string
  description?: string
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
    console.log('Calling AI model with prompt length:', prompt.length)
    console.log('Model:', model)
    
    // Use Google GenAI SDK directly
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
    })

    console.log('AI response received, type:', typeof response)

    // Extract text from response
    // GenerateContentResponse has a .text getter property that returns the concatenated text
    let text: string
    if (response.text) {
      text = response.text
    } else if (response.candidates && response.candidates.length > 0) {
      // Fallback: extract from candidates
      const candidate = response.candidates[0]
      if (candidate.content?.parts?.[0]?.text) {
        text = candidate.content.parts[0].text
      } else {
        text = JSON.stringify(response)
      }
    } else {
      text = JSON.stringify(response)
    }
    
    console.log('Extracted text length:', text.length)

    // Try to extract JSON from markdown code blocks if present
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/)
    const jsonText = jsonMatch ? jsonMatch[1] : text

    let parsedResponse: any
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

    const generatedTitle = validation.title || parsedResponse.title
    const generatedDescription = validation.description || parsedResponse.description

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
          const correctOption = q.options.find((o: { isCorrect: boolean }) => o.isCorrect)
          if (correctOption) {
            correctAnswer = correctOption.id
          }
        } else if (mappedType === 'multiple_select') {
          // Ensure correctAnswer is array of optionIds
          correctAnswer = q.options.filter((o: { isCorrect: boolean }) => o.isCorrect).map((o: { id: string }) => o.id)
        }
      }

      // For ordering, ensure correctAnswer is array of optionIds
      if (mappedType === 'ordering' && q.options) {
        if (!Array.isArray(correctAnswer)) {
          // Use option order as default
          correctAnswer = q.options.map((o: { id: string }) => o.id)
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
      title: generatedTitle || params.title,
      description: generatedDescription || params.description,
      processingTimeMs,
    }
  } catch (error) {
    const processingTimeMs = Date.now() - startTime
    throw new Error(
      `AI generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
