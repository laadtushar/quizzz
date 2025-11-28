'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'

const quizSettingsSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().optional(),
  visibility: z.enum(['visible', 'hidden']),
  settingsTimerSeconds: z.number().int().positive().nullable().optional(),
  settingsAllowRetries: z.boolean(),
  settingsMaxAttempts: z.number().int().positive().nullable().optional(),
  settingsDifficultyLevel: z.enum(['easy', 'medium', 'hard']),
  settingsPassingScore: z.number().min(0).max(100).nullable().optional(),
  tags: z.array(z.string()).default([]),
})

type QuizSettingsFormData = z.infer<typeof quizSettingsSchema>

interface QuizSettingsFormProps {
  quizId: string
  initialData?: {
    title: string
    description?: string | null
    visibility: 'visible' | 'hidden'
    settingsTimerSeconds?: number | null
    settingsAllowRetries: boolean
    settingsMaxAttempts?: number | null
    settingsDifficultyLevel: string
    settingsPassingScore?: number | null
    tags: string[]
  }
  onSave?: () => void
}

export function QuizSettingsForm({
  quizId,
  initialData,
  onSave,
}: QuizSettingsFormProps) {
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [tagsInput, setTagsInput] = useState(
    initialData?.tags?.join(', ') || ''
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<QuizSettingsFormData>({
    resolver: zodResolver(quizSettingsSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      visibility: initialData?.visibility || 'visible',
      settingsTimerSeconds: initialData?.settingsTimerSeconds || null,
      settingsAllowRetries: initialData?.settingsAllowRetries ?? true,
      settingsMaxAttempts: initialData?.settingsMaxAttempts || null,
      settingsDifficultyLevel:
        (initialData?.settingsDifficultyLevel as 'easy' | 'medium' | 'hard') ||
        'medium',
      settingsPassingScore: initialData?.settingsPassingScore || null,
      tags: initialData?.tags || [],
    },
  })

  const timerMinutes = initialData?.settingsTimerSeconds
    ? Math.floor(initialData.settingsTimerSeconds / 60)
    : null

  const onSubmit = async (data: QuizSettingsFormData) => {
    setIsSaving(true)
    try {
      // Parse tags from comma-separated string
      const tags = tagsInput
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)

      // Convert timer minutes to seconds
      const timerMinutes = data.settingsTimerSeconds
      const timerSeconds = timerMinutes ? timerMinutes * 60 : null

      // API expects flat structure for settings
      const updateBody: any = {
        title: data.title,
        description: data.description || null,
        visibility: data.visibility,
        tags,
        settingsTimerSeconds: timerSeconds,
        settingsAllowRetries: data.settingsAllowRetries,
        settingsMaxAttempts: data.settingsMaxAttempts || null,
        settingsDifficultyLevel: data.settingsDifficultyLevel,
        settingsPassingScore: data.settingsPassingScore,
      }

      const response = await fetch(`/api/quizzes/${quizId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateBody),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save quiz settings')
      }

      toast({
        title: 'Settings saved',
        description: 'Quiz settings have been updated successfully.',
      })

      onSave?.()
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to save quiz settings',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Quiz Title *</Label>
        <Input
          id="title"
          {...register('title')}
          placeholder="Enter quiz title"
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Enter quiz description"
          rows={4}
        />
        {errors.description && (
          <p className="text-sm text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="visibility">Visibility</Label>
        <Select
          value={watch('visibility')}
          onValueChange={(value) =>
            setValue('visibility', value as 'visible' | 'hidden')
          }
        >
          <SelectTrigger id="visibility">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="visible">Visible to all</SelectItem>
            <SelectItem value="hidden">Hidden (assignment only)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="difficulty">Difficulty Level</Label>
        <Select
          value={watch('settingsDifficultyLevel')}
          onValueChange={(value) =>
            setValue('settingsDifficultyLevel', value as 'easy' | 'medium' | 'hard')
          }
        >
          <SelectTrigger id="difficulty">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="easy">Easy</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="hard">Hard</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="timer">Time Limit (minutes)</Label>
        <Input
          id="timer"
          type="number"
          min="1"
          placeholder="Leave empty for unlimited"
          value={timerMinutes?.toString() || ''}
          onChange={(e) => {
            const minutes = e.target.value ? parseInt(e.target.value) : null
            setValue('settingsTimerSeconds', minutes, { shouldValidate: true })
          }}
        />
        <p className="text-sm text-muted-foreground">
          Leave empty for unlimited time
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="allowRetries">Allow Retries</Label>
          <p className="text-sm text-muted-foreground">
            Allow users to retake this quiz
          </p>
        </div>
        <Switch
          id="allowRetries"
          checked={watch('settingsAllowRetries')}
          onCheckedChange={(checked) =>
            setValue('settingsAllowRetries', checked)
          }
        />
      </div>

      {watch('settingsAllowRetries') && (
        <div className="space-y-2">
          <Label htmlFor="maxAttempts">Maximum Attempts</Label>
          <Input
            id="maxAttempts"
            type="number"
            min="1"
            placeholder="Leave empty for unlimited"
            value={watch('settingsMaxAttempts')?.toString() || ''}
            onChange={(e) => {
              const value = e.target.value
              setValue(
                'settingsMaxAttempts',
                value ? parseInt(value) : null,
                { shouldValidate: true }
              )
            }}
          />
          <p className="text-sm text-muted-foreground">
            Maximum number of attempts allowed (leave empty for unlimited)
          </p>
          {errors.settingsMaxAttempts && (
            <p className="text-sm text-destructive">
              {errors.settingsMaxAttempts.message}
            </p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="passingScore">Passing Score (%)</Label>
        <Input
          id="passingScore"
          type="number"
          min="0"
          max="100"
          placeholder="Leave empty for no passing score"
          {...register('settingsPassingScore', {
            valueAsNumber: true,
            setValueAs: (v) => (v === '' ? null : Number(v)),
          })}
        />
        <p className="text-sm text-muted-foreground">
          Minimum percentage to pass (0-100)
        </p>
        {errors.settingsPassingScore && (
          <p className="text-sm text-destructive">
            {errors.settingsPassingScore.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <Input
          id="tags"
          placeholder="Enter tags separated by commas"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
        />
        <p className="text-sm text-muted-foreground">
          Separate multiple tags with commas
        </p>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Settings
        </Button>
      </div>
    </form>
  )
}

