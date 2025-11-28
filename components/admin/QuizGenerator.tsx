'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { generateQuizSchema } from '@/lib/validations/ai-generation'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'

export function QuizGenerator() {
  const router = useRouter()
  const { toast } = useToast()
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['mcq'])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(generateQuizSchema),
    defaultValues: {
      inputText: '',
      questionCount: 10,
      difficulty: 'medium' as const,
      questionTypes: ['mcq'],
      title: '',
      description: '',
    },
  })

  const [jobId, setJobId] = useState<string | null>(null)
  const [polling, setPolling] = useState(false)

  const generateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/ai/generate-quiz/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, questionTypes: selectedTypes }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to start generation')
      }
      return res.json()
    },
    onSuccess: (data) => {
      setJobId(data.jobId)
      setPolling(true)
      toast({
        title: 'Generation started',
        description: 'Processing your quiz. This may take a few minutes...',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Generation failed',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  // Poll for status updates
  useEffect(() => {
    if (!jobId || !polling) return

    let pollCount = 0
    const maxPolls = 150 // 5 minutes max (150 * 2 seconds = 300 seconds)
    
    const pollInterval = setInterval(async () => {
      pollCount++
      
      // Stop polling after max attempts
      if (pollCount > maxPolls) {
        setPolling(false)
        clearInterval(pollInterval)
        toast({
          title: 'Generation timeout',
          description: 'Generation is taking longer than expected. Please check back later or try again.',
          variant: 'destructive',
        })
        return
      }

      try {
        const res = await fetch(`/api/ai/generate-quiz/status/${jobId}`)
        if (!res.ok) {
          throw new Error('Failed to check status')
        }
        const status = await res.json()

        if (status.status === 'success') {
          setPolling(false)
          clearInterval(pollInterval)
          toast({
            title: 'Quiz generated!',
            description: `Successfully generated ${status.questionsGenerated} questions`,
          })
          if (status.quiz?.id) {
            router.push(`/dashboard/admin/quizzes/${status.quiz.id}`)
          }
        } else if (status.status === 'error') {
          setPolling(false)
          clearInterval(pollInterval)
          toast({
            title: 'Generation failed',
            description: status.errorMessage || 'An error occurred during generation',
            variant: 'destructive',
          })
        }
        // If still processing, continue polling
      } catch (error) {
        console.error('Polling error:', error)
        // Continue polling on error (network issues, etc.)
      }
    }, 2000) // Poll every 2 seconds

    return () => clearInterval(pollInterval)
  }, [jobId, polling, router, toast])

  const onSubmit = (data: any) => {
    generateMutation.mutate({ ...data, questionTypes: selectedTypes })
  }

  const questionTypeOptions = [
    { value: 'mcq', label: 'Multiple Choice' },
    { value: 'multiple_select', label: 'Multiple Select' },
    { value: 'true_false', label: 'True/False' },
    { value: 'ordering', label: 'Ordering' },
    { value: 'fill_blank', label: 'Fill in the Blank' },
  ]

  const toggleQuestionType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    )
    setValue('questionTypes', selectedTypes.includes(type)
      ? selectedTypes.filter((t) => t !== type)
      : [...selectedTypes, type])
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Quiz Generator</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Quiz Title (Optional)</Label>
            <Input
              id="title"
              {...register('title', { required: false })}
              placeholder="Enter quiz title (optional)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Enter quiz description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="inputText">Source Text *</Label>
            <Textarea
              id="inputText"
              {...register('inputText')}
              placeholder="Paste the text you want to generate questions from (minimum 100 characters, up to 1,000,000 characters for large transcripts)"
              rows={15}
              className="font-mono text-sm"
            />
            {errors.inputText && (
              <p className="text-sm text-destructive">{errors.inputText.message as string}</p>
            )}
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {watch('inputText')?.length || 0} / 1,000,000 characters
              </p>
              {watch('inputText')?.length > 50000 && (
                <p className="text-xs text-blue-600">
                  Large transcript detected - processing may take longer
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="questionCount">Number of Questions</Label>
              <Input
                id="questionCount"
                type="number"
                min={5}
                max={50}
                {...register('questionCount', { valueAsNumber: true })}
              />
              {errors.questionCount && (
                <p className="text-sm text-destructive">{errors.questionCount.message as string}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select
                onValueChange={(value) => setValue('difficulty', value as any)}
                defaultValue="medium"
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Question Types *</Label>
            <div className="grid grid-cols-2 gap-2">
              {questionTypeOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={option.value}
                    checked={selectedTypes.includes(option.value)}
                    onCheckedChange={() => toggleQuestionType(option.value)}
                  />
                  <Label
                    htmlFor={option.value}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
            {selectedTypes.length === 0 && (
              <p className="text-sm text-destructive">Select at least one question type</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={generateMutation.isPending || polling || selectedTypes.length === 0}
          >
            {generateMutation.isPending || polling ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {polling ? 'Generating... (this may take a few minutes)' : 'Starting...'}
              </>
            ) : (
              'Generate Quiz'
            )}
          </Button>
          {polling && jobId && (
            <p className="text-sm text-muted-foreground text-center">
              Processing your quiz. Please keep this page open. Large transcripts may take several minutes.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  )
}

