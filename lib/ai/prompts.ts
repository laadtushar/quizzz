export function buildQuizGenerationPrompt(
  inputText: string,
  questionCount: number,
  difficulty: string,
  questionTypes: string[]
): string {
  return `You are an expert quiz creator. Generate ${questionCount} quiz questions from the following text.

Text to analyze:
${inputText}

Requirements:
- Generate exactly ${questionCount} questions
- Difficulty level: ${difficulty}
- Question types to use: ${questionTypes.join(', ')}
- Each question must have a clear, unambiguous correct answer
- Include explanations for each answer
- Questions should test understanding, not just memorization

For each question type:
- MCQ: Provide 4 options, exactly one correct
- Multiple-select: Provide 4-5 options, 2-3 correct
- True/False: Simple true or false statement
- Ordering: Provide 4-5 items to arrange in correct sequence
- Fill-blank: Single word or short phrase answer

Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "type": "mcq" | "multiple_select" | "true_false" | "ordering" | "fill_blank",
      "questionText": "The question text",
      "points": 10,
      "options": [{"id": "A", "text": "Option text", "isCorrect": true/false}], // For MCQ, multiple-select, ordering
      "correctAnswer": "correct answer", // Format varies by type
      "explanation": "Why this is the correct answer"
    }
  ]
}

For correctAnswer format:
- MCQ: string (optionId like "A")
- Multiple-select: array of optionIds like ["A", "C"]
- True/False: boolean (true or false)
- Ordering: array of optionIds in correct order like ["A", "B", "C", "D"]
- Fill-blank: string (the correct answer text)

Generate the questions now:`
}

