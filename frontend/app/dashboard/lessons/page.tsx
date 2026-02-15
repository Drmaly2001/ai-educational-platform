'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { canAccess } from '@/lib/roles'
import api from '@/lib/api'
import { ClipboardList, Loader2, Brain } from 'lucide-react'

interface LessonItem {
  id: number
  topic: string
  week_number: number
  day_number: number | null
  difficulty_level: string
  duration_minutes: number
  is_published: boolean
  ai_generated: boolean
  syllabus_id: number | null
  created_at: string
}

export default function LessonsPage() {
  const { user } = useAuth()
  const [lessons, setLessons] = useState<LessonItem[]>([])
  const [loading, setLoading] = useState(true)
  const canManage = canAccess(user?.role || '', 'lessons:create')

  useEffect(() => {
    async function fetchLessons() {
      try {
        const response = await api.get('/lessons/')
        setLessons(response.data)
      } catch {
        // Will show empty state
      } finally {
        setLoading(false)
      }
    }
    fetchLessons()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  // Group lessons by week
  const groupedLessons = lessons.reduce<Record<number, LessonItem[]>>((acc, lesson) => {
    const week = lesson.week_number
    if (!acc[week]) acc[week] = []
    acc[week].push(lesson)
    return acc
  }, {})

  const weekNumbers = Object.keys(groupedLessons)
    .map(Number)
    .sort((a, b) => a - b)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {canManage ? 'Lessons' : 'My Lessons'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {canManage ? 'View and manage your lesson plans' : 'View your assigned lessons'}
          </p>
        </div>
      </div>

      {lessons.length === 0 ? (
        <div className="rounded-xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-gray-100">
          <ClipboardList className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No lessons yet</h3>
          <p className="mt-2 text-sm text-gray-500">
            {canManage ? 'Generate lessons from a syllabus using AI.' : 'No lessons have been assigned to you yet.'}
          </p>
          {canManage && (
            <Link href="/dashboard/syllabi" className="btn-primary mt-6 inline-flex gap-2">
              <Brain className="h-4 w-4" />
              Go to Syllabi
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {weekNumbers.map((weekNum) => (
            <div key={weekNum}>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase text-gray-500">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                  {weekNum}
                </span>
                Week {weekNum}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {groupedLessons[weekNum].map((lesson) => (
                  <Link
                    key={lesson.id}
                    href={`/dashboard/lessons/${lesson.id}`}
                    className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100 transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <h3 className="text-sm font-semibold text-gray-900">{lesson.topic}</h3>
                      <div className="flex gap-1.5">
                        {lesson.ai_generated && (
                          <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                            AI
                          </span>
                        )}
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            lesson.is_published ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                          }`}
                        >
                          {lesson.is_published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 flex gap-3 text-xs text-gray-500">
                      <span>{lesson.duration_minutes} min</span>
                      <span>{lesson.difficulty_level}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
