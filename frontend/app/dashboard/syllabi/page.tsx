'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { canAccess } from '@/lib/roles'
import api from '@/lib/api'
import { Plus, FileText, Brain, Loader2 } from 'lucide-react'

interface SyllabusItem {
  id: number
  name: string
  subject: string
  grade_level: string
  curriculum_standard: string
  duration_weeks: number
  is_published: boolean
  ai_generated: boolean
  created_at: string
}

export default function SyllabiPage() {
  const { user } = useAuth()
  const [syllabi, setSyllabi] = useState<SyllabusItem[]>([])
  const [loading, setLoading] = useState(true)
  const canGenerate = canAccess(user?.role || '', 'syllabi:generate')

  useEffect(() => {
    async function fetchSyllabi() {
      try {
        const response = await api.get('/syllabi/')
        setSyllabi(response.data)
      } catch {
        // Will show empty state
      } finally {
        setLoading(false)
      }
    }
    fetchSyllabi()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Syllabi</h1>
          <p className="mt-1 text-sm text-gray-500">
            {canGenerate ? 'Manage and generate your curriculum syllabi' : 'View your assigned syllabi'}
          </p>
        </div>
        {canGenerate && (
          <Link href="/dashboard/syllabi/generate" className="btn-primary gap-2">
            <Brain className="h-4 w-4" />
            Generate with AI
          </Link>
        )}
      </div>

      {syllabi.length === 0 ? (
        <div className="rounded-xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-gray-100">
          <FileText className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No syllabi yet</h3>
          <p className="mt-2 text-sm text-gray-500">
            {canGenerate ? 'Use AI to generate your first syllabus automatically.' : 'No syllabi have been assigned yet.'}
          </p>
          {canGenerate && (
            <Link href="/dashboard/syllabi/generate" className="btn-primary mt-6 inline-flex gap-2">
              <Brain className="h-4 w-4" />
              Generate with AI
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {syllabi.map((syllabus) => (
            <Link
              key={syllabus.id}
              href={`/dashboard/syllabi/${syllabus.id}`}
              className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex gap-2">
                  {syllabus.ai_generated && (
                    <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                      AI
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      syllabus.is_published ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                    }`}
                  >
                    {syllabus.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>
              <h3 className="mt-3 text-base font-semibold text-gray-900">{syllabus.name}</h3>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-500">
                  <span className="font-medium text-gray-700">Subject:</span> {syllabus.subject}
                </p>
                <p className="text-sm text-gray-500">
                  <span className="font-medium text-gray-700">Grade:</span> {syllabus.grade_level}
                </p>
                <p className="text-sm text-gray-500">
                  <span className="font-medium text-gray-700">Standard:</span> {syllabus.curriculum_standard}
                </p>
                <p className="text-sm text-gray-500">
                  <span className="font-medium text-gray-700">Duration:</span> {syllabus.duration_weeks} weeks
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
