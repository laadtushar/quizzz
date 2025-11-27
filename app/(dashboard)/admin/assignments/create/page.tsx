'use client'

import { AssignmentCreator } from '@/components/admin/AssignmentCreator'

export default function CreateAssignmentPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Create Assignment</h1>
      <AssignmentCreator />
    </div>
  )
}
