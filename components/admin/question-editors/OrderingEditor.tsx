'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, ArrowUp, ArrowDown, GripVertical } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Option {
  id: string
  text: string
}

interface OrderingEditorProps {
  questionText: string
  points: number
  options: Option[]
  correctAnswer?: string[]
  explanation?: string
  imageUrl?: string
  onChange: (data: {
    questionText: string
    points: number
    options: Option[]
    correctAnswer: string[]
    explanation?: string
    imageUrl?: string
  }) => void
}

function SortableOption({
  option,
  index,
  onRemove,
  onUpdate,
}: {
  option: Option
  index: number
  onRemove: (id: string) => void
  onUpdate: (id: string, text: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: option.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <Input
                placeholder={`Item ${index + 1}`}
                value={option.text}
                onChange={(e) => onUpdate(option.id, e.target.value)}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onRemove(option.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function OrderingEditor({
  questionText: initialQuestionText,
  points: initialPoints,
  options: initialOptions,
  correctAnswer: initialCorrectAnswer,
  explanation: initialExplanation,
  imageUrl: initialImageUrl,
  onChange,
}: OrderingEditorProps) {
  const [questionText, setQuestionText] = useState(initialQuestionText)
  const [points, setPoints] = useState(initialPoints)
  const [options, setOptions] = useState<Option[]>(
    initialOptions.length > 0
      ? initialOptions
      : [
          { id: '1', text: '' },
          { id: '2', text: '' },
        ]
  )
  const [explanation, setExplanation] = useState(initialExplanation || '')
  const [imageUrl, setImageUrl] = useState(initialImageUrl || '')

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    const correctOrder = options.map((opt) => opt.id)
    onChange({
      questionText,
      points,
      options,
      correctAnswer: correctOrder,
      explanation,
      imageUrl,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionText, points, options, explanation, imageUrl])

  const addOption = () => {
    const newId = String(Date.now())
    setOptions([...options, { id: newId, text: '' }])
  }

  const removeOption = (id: string) => {
    if (options.length <= 2) return
    setOptions(options.filter((opt) => opt.id !== id))
  }

  const updateOption = (id: string, text: string) => {
    setOptions(
      options.map((opt) => (opt.id === id ? { ...opt, text } : opt))
    )
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setOptions((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="questionText">Question Text *</Label>
        <Textarea
          id="questionText"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder="Enter your ordering question (e.g., Arrange these steps in order)"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="points">Points *</Label>
        <Input
          id="points"
          type="number"
          min="1"
          value={points}
          onChange={(e) => setPoints(parseInt(e.target.value) || 1)}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Items to Order * (Drag to reorder)</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addOption}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Item
          </Button>
        </div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={options.map((opt) => opt.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {options.map((option, index) => (
                <SortableOption
                  key={option.id}
                  option={option}
                  index={index}
                  onRemove={removeOption}
                  onUpdate={updateOption}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        <p className="text-sm text-muted-foreground">
          The correct order is the order shown above. Drag items to reorder.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="explanation">Explanation</Label>
        <Textarea
          id="explanation"
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder="Explain the correct order"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="imageUrl">Image URL (optional)</Label>
        <Input
          id="imageUrl"
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://example.com/image.jpg"
        />
      </div>
    </div>
  )
}

