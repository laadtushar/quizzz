'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Upload, FileText, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

interface BulkAssignmentImporterProps {
  onSuccess?: () => void
}

export function BulkAssignmentImporter({ onSuccess }: BulkAssignmentImporterProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<any[] | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  const bulkCreateMutation = useMutation({
    mutationFn: async (assignments: any[]) => {
      const res = await fetch('/api/assignments/bulk-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create assignments')
      }
      return res.json()
    },
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: `Created ${data.created} assignment(s)${
          data.duplicates > 0 ? `, ${data.duplicates} duplicate(s) skipped` : ''
        }`,
      })
      setFile(null)
      setPreview(null)
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      onSuccess?.()
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.json')) {
      toast({
        title: 'Invalid file',
        description: 'Please select a CSV or JSON file',
        variant: 'destructive',
      })
      return
    }

    setFile(selectedFile)
    setIsValidating(true)

    try {
      const text = await selectedFile.text()
      let data: any[]

      if (selectedFile.name.endsWith('.csv')) {
        // Parse CSV
        const lines = text.split('\n').filter((line) => line.trim())
        const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''))
        
        data = lines.slice(1).map((line) => {
          const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''))
          const obj: any = {}
          headers.forEach((header, index) => {
            obj[header.toLowerCase().replace(/\s+/g, '')] = values[index] || ''
          })
          return obj
        })
      } else {
        // Parse JSON
        data = JSON.parse(text)
        if (!Array.isArray(data)) {
          throw new Error('JSON must be an array of assignments')
        }
      }

      // Validate and normalize
      const validated: any[] = []
      const errors: string[] = []

      data.forEach((row, index) => {
        const quizId = row.quizid || row.quiz_id || row.quizId
        const userId = row.userid || row.user_id || row.userId
        const dueDate = row.duedate || row.due_date || row.dueDate

        if (!quizId || !userId) {
          errors.push(`Row ${index + 2}: Missing quizId or userId`)
          return
        }

        validated.push({
          quizId: quizId.trim(),
          userId: userId.trim(),
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        })
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
          description: `Found ${validated.length} valid assignment(s)`,
        })
      }
    } catch (error) {
      toast({
        title: 'Error parsing file',
        description: error instanceof Error ? error.message : 'Invalid file format',
        variant: 'destructive',
      })
      setPreview(null)
    } finally {
      setIsValidating(false)
    }
  }

  const handleImport = () => {
    if (!preview || preview.length === 0) return
    bulkCreateMutation.mutate(preview)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Import Assignments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="bulk-file-upload">Upload CSV or JSON File</Label>
          <Input
            id="bulk-file-upload"
            type="file"
            accept=".csv,.json"
            onChange={handleFileSelect}
            disabled={isValidating || bulkCreateMutation.isPending}
          />
          <p className="text-sm text-muted-foreground">
            Upload a CSV or JSON file containing assignments. See format below.
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
              {preview.length} valid assignment(s) ready to import
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {preview.slice(0, 10).map((assignment, index) => (
                <div
                  key={index}
                  className="p-3 border rounded-md text-sm bg-muted/50"
                >
                  <div className="font-medium">Assignment {index + 1}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Quiz ID: {assignment.quizId.substring(0, 8)}... | User ID:{' '}
                    {assignment.userId.substring(0, 8)}...
                    {assignment.dueDate && (
                      <> | Due: {new Date(assignment.dueDate).toLocaleDateString()}</>
                    )}
                  </div>
                </div>
              ))}
              {preview.length > 10 && (
                <p className="text-xs text-muted-foreground text-center">
                  ... and {preview.length - 10} more
                </p>
              )}
            </div>
            <Button
              onClick={handleImport}
              disabled={bulkCreateMutation.isPending}
              className="w-full"
            >
              {bulkCreateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Import {preview.length} Assignment(s)
                </>
              )}
            </Button>
          </div>
        )}

        <div className="mt-4 p-4 bg-muted rounded-md">
          <div className="text-sm font-medium mb-2">CSV Format Example:</div>
          <pre className="text-xs overflow-x-auto">
            {`quizId,userId,dueDate
"quiz-uuid-1","user-uuid-1","2024-12-31T23:59:59Z"
"quiz-uuid-2","user-uuid-2","2024-12-31T23:59:59Z"`}
          </pre>
          <div className="text-sm font-medium mb-2 mt-4">JSON Format Example:</div>
          <pre className="text-xs overflow-x-auto">
            {JSON.stringify(
              [
                {
                  quizId: 'quiz-uuid-1',
                  userId: 'user-uuid-1',
                  dueDate: '2024-12-31T23:59:59Z',
                },
                {
                  quizId: 'quiz-uuid-2',
                  userId: 'user-uuid-2',
                  dueDate: null,
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

