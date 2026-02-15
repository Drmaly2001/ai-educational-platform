'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import {
  ArrowLeft,
  Loader2,
  Clock,
  Target,
  BookOpen,
  MessageCircle,
  PenTool,
  Lightbulb,
  CheckCircle,
} from 'lucide-react'

interface Example {
  title: string
  content: string
  type?: string
}

interface Activity {
  title: string
  description: string
  duration_minutes?: number
  type?: string
  materials_needed?: string[]
}

interface Resource {
  title: string
  type: string
  description: string
}

interface LessonDetail {
  id: number
  topic: string
  week_number: number
  day_number: number | null
  difficulty_level: string
  duration_minutes: number
  learning_goals: string[]
  prerequisites: string[] | null
  explanation: string
  examples: Example[] | null
  activities: Activity[] | null
  discussion_questions: string[] | null
  homework: string | null
  resources: Resource[] | null
  ai_generated: boolean
  ai_model_version: string | null
  is_published: boolean
  created_at: string
}

export default function LessonDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [lesson, setLesson] = useState<LessonDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchLesson() {
      try {
        const response = await api.get(`/lessons/${params.id}`)
        setLesson(response.data)
      } catch {
        router.push('/dashboard/lessons')
      } finally {
        setLoading(false)
      }
    }
    fetchLesson()
  }, [params.id, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!lesson) return null

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/lessons"
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Lessons
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{lesson.topic}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Week {lesson.week_number} | {lesson.duration_minutes} minutes
              </span>
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                {lesson.difficulty_level}
              </span>
              {lesson.ai_generated && (
                <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700">
                  AI Generated
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Learning Goals */}
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Target className="h-5 w-5 text-blue-600" />
              Learning Goals
            </h2>
            <ul className="mt-3 space-y-2">
              {lesson.learning_goals.map((goal, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  {goal}
                </li>
              ))}
            </ul>
          </div>

          {/* Explanation */}
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <BookOpen className="h-5 w-5 text-primary-600" />
              Explanation
            </h2>
            <div className="mt-3 prose prose-sm max-w-none text-gray-600">
              {lesson.explanation.split('\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>

          {/* Examples */}
          {lesson.examples && lesson.examples.length > 0 && (
            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                Examples
              </h2>
              <div className="mt-3 space-y-4">
                {lesson.examples.map((example, index) => (
                  <div key={index} className="rounded-lg bg-yellow-50 p-4">
                    <h3 className="text-sm font-semibold text-gray-900">{example.title}</h3>
                    {example.type && (
                      <span className="mt-1 inline-block rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800">
                        {example.type}
                      </span>
                    )}
                    <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">{example.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activities */}
          {lesson.activities && lesson.activities.length > 0 && (
            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <PenTool className="h-5 w-5 text-green-600" />
                Activities
              </h2>
              <div className="mt-3 space-y-4">
                {lesson.activities.map((activity, index) => (
                  <div key={index} className="rounded-lg border border-gray-100 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900">{activity.title}</h3>
                      <div className="flex gap-2 text-xs text-gray-500">
                        {activity.duration_minutes && <span>{activity.duration_minutes} min</span>}
                        {activity.type && (
                          <span className="rounded-full bg-green-50 px-2 py-0.5 font-medium text-green-700">
                            {activity.type}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">{activity.description}</p>
                    {activity.materials_needed && activity.materials_needed.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-gray-500">Materials needed:</p>
                        <ul className="mt-1 flex flex-wrap gap-1">
                          {activity.materials_needed.map((material, i) => (
                            <li
                              key={i}
                              className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                            >
                              {material}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Discussion Questions */}
          {lesson.discussion_questions && lesson.discussion_questions.length > 0 && (
            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <MessageCircle className="h-5 w-5 text-purple-600" />
                Discussion Questions
              </h2>
              <ol className="mt-3 space-y-2">
                {lesson.discussion_questions.map((question, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-50 text-xs font-bold text-purple-700">
                      {index + 1}
                    </span>
                    {question}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Homework */}
          {lesson.homework && (
            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <PenTool className="h-5 w-5 text-red-600" />
                Homework
              </h2>
              <p className="mt-3 text-sm text-gray-600">{lesson.homework}</p>
            </div>
          )}

          {/* Prerequisites */}
          {lesson.prerequisites && lesson.prerequisites.length > 0 && (
            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Prerequisites</h2>
              <ul className="mt-3 space-y-1">
                {lesson.prerequisites.map((prereq, index) => (
                  <li key={index} className="text-sm text-gray-600">- {prereq}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Resources */}
          {lesson.resources && lesson.resources.length > 0 && (
            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Resources</h2>
              <div className="mt-3 space-y-2">
                {lesson.resources.map((resource: any, index: number) => (
                  <div key={index}>
                    <p className="text-sm font-medium text-gray-900">{resource.title}</p>
                    <p className="text-xs text-gray-500">{resource.type} - {resource.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
