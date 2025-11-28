'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Upload, FileText, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { QuestionType } from '@prisma/client'

interface QuestionImport {
  type: QuestionType
  questionText: string
  points: number
  options?: Array<{ id: string; text: string; isCorrect: boolean }>
  correctAnswer: any
  explanation?: string
  imageUrl?: string
}

interface BulkQuestionImporterProps {
  quizId: string
  onSuccess?: () => void
}

export function BulkQuestionImporter({
  quizId,
  onSuccess,
}: BulkQuestionImporterProps) {
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<QuestionImport[] | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isValidating, setIsValidating] = useState(false)

  const validateQuestion = (q: any, index: number): string | null => {
    if (!q.type || !['mcq', 'multiple_select', 'true_false', 'ordering', 'fill_blank'].includes(q.type)) {
      return `Question ${index + 1}: Invalid type`
    }
    if (!q.questionText || !q.questionText.trim()) {
      return `Question ${index + 1}: Missing question text`
    }
    if (!q.points || q.points < 1) {
      return `Question ${index + 1}: Invalid points (must be >= 1)`
    }
    if (q.type === 'mcq' || q.type === 'multiple_select') {
      if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
        return `Question ${index + 1}: Need at least 2 options`
      }
      if (q.options.some((opt: any) => !opt.text || !opt.text.trim())) {
        return `Question ${index + 1}: Options cannot be empty`
      }
      const hasCorrect = q.options.some((opt: any) => opt.isCorrect)
      if (!hasCorrect) {
        return `Question ${index + 1}: At least one option must be correct`
      }
    }
    if (q.type === 'ordering') {
      if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
        return `Question ${index + 1}: Need at least 2 items to order`
      }
    }
    if (q.type === 'fill_blank') {
      if (!q.correctAnswer || (typeof q.correctAnswer === 'string' && !q.correctAnswer.trim())) {
        return `Question ${index + 1}: Missing correct answer`
      }
    }
    return null
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith('.json')) {
      toast({
        title: 'Invalid file',
        description: 'Please select a JSON file',
        variant: 'destructive',
      })
      return
    }

    setFile(selectedFile)
    setIsValidating(true)

    try {
      const text = await selectedFile.text()
      const data = JSON.parse(text)

      if (!Array.isArray(data)) {
        throw new Error('JSON must be an array of questions')
      }

      const errors: string[] = []
      const validated: QuestionImport[] = []

      data.forEach((q: any, index: number) => {
        const error = validateQuestion(q, index)
        if (error) {
          errors.push(error)
        } else {
          // Normalize the question data
          const normalized: QuestionImport = {
            type: q.type,
            questionText: q.questionText.trim(),
            points: Number(q.points),
            correctAnswer: q.correctAnswer,
            explanation: q.explanation?.trim() || undefined,
            imageUrl: q.imageUrl?.trim() || undefined,
          }

          if (q.options) {
            normalized.options = q.options.map((opt: any, optIndex: number) => ({
              id: opt.id || `opt-${index}-${optIndex}`,
              text: opt.text.trim(),
              isCorrect: Boolean(opt.isCorrect),
            }))
          }

          validated.push(normalized)
        }
      })

      if (errors.length > 0) {
        toast({
          title: 'Validation errors',
          description: `${errors.length} error(s) found. First error: ${errors[0]}`,
          variant: 'destructive',
        })
        setPreview(null)
      } else {
        setPreview(validated)
        toast({
          title: 'File validated',
          description: `Found ${validated.length} valid question(s)`,
        })
      }
    } catch (error) {
      toast({
        title: 'Error parsing file',
        description: error instanceof Error ? error.message : 'Invalid JSON format',
        variant: 'destructive',
      })
      setPreview(null)
    } finally {
      setIsValidating(false)
    }
  }

  const handleImport = async () => {
    if (!preview || preview.length === 0) return

    setIsUploading(true)
    try {
      // Import questions one by one (or batch if API supports it)
      const results = await Promise.allSettled(
        preview.map((q, index) =>
          fetch(`/api/quizzes/${quizId}/questions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...q,
              orderIndex: index,
            }),
          })
        )
      )

      const successful = results.filter((r) => r.status === 'fulfilled').length
      const failed = results.filter((r) => r.status === 'rejected').length

      if (failed > 0) {
        toast({
          title: 'Partial success',
          description: `Imported ${successful} question(s), ${failed} failed`,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Success',
          description: `Successfully imported ${successful} question(s)`,
        })
      }

      setFile(null)
      setPreview(null)
      onSuccess?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to import questions',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Import Questions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="file-upload">Upload JSON File</Label>
          <Input
            id="file-upload"
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            disabled={isValidating || isUploading}
          />
          <p className="text-sm text-muted-foreground">
            Upload a JSON file containing an array of questions. See format below.
          </p>
        </div>

        {isValidating && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Validating file...
          </div>
        )}

        {preview && preview.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              {preview.length} valid question(s) ready to import
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {preview.map((q, index) => (
                <div
                  key={index}
                  className="p-3 border rounded-md text-sm bg-muted/50"
                >
                  <div className="font-medium">Question {index + 1}</div>
                  <div className="text-muted-foreground line-clamp-2">
                    {q.questionText}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Type: {q.type} | Points: {q.points}
                  </div>
                </div>
              ))}
            </div>
            <Button
              onClick={handleImport}
              disabled={isUploading}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Import {preview.length} Question(s)
                </>
              )}
            </Button>
          </div>
        )}

        <div className="mt-4 p-4 bg-muted rounded-md">
          <div className="text-sm font-medium mb-2">JSON Format Example:</div>
          <pre className="text-xs overflow-x-auto">
            {JSON.stringify(
              [
                {
                  type: 'mcq',
                  questionText: 'What is 2 + 2?',
                  points: 10,
                  options: [
                    { id: '1', text: '3', isCorrect: false },
                    { id: '2', text: '4', isCorrect: true },
                    { id: '3', text: '5', isCorrect: false },
                  ],
                  correctAnswer: '2',
                  explanation: 'Basic addition',
                },
              ],
              null,
              2
            )}
          </pre>
        </div>
      </CardContent>
    </Card>
  )
}

