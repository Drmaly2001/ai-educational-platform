'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import {
  ArrowLeft,
  Brain,
  FileText,
  Loader2,
  CheckCircle,
  Clock,
  BookOpen,
  ClipboardList,
} from 'lucide-react'

interface WeekBreakdown {
  week: number
  topic: string
  subtopics?: string[]
  learning_goals?: string[]
  activities?: string[]
  resources?: string[]
}

interface AssessmentPlan {
  week: number
  type: string
  title: string
  description: string
  weight_percentage?: number
}

interface SyllabusDetail {
  id: number
  name: string
  subject: string
  grade_level: string
  curriculum_standard: string
  duration_weeks: number
  learning_objectives: string[]
  weekly_breakdown: WeekBreakdown[]
  assessment_plan: AssessmentPlan[]
  revision_schedule: any[]
  resources: any[]
  is_published: boolean
  ai_generated: boolean
  created_at: string
}

export default function SyllabusDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [syllabus, setSyllabus] = useState<SyllabusDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSyllabus() {
      try {
        const response = await api.get(`/syllabi/${params.id}`)
        setSyllabus(response.data)
      } catch {
        router.push('/dashboard/syllabi')
      } finally {
        setLoading(false)
      }
    }
    fetchSyllabus()
  }, [params.id, router])

  async function generateLessons() {
    if (!syllabus) return
    setGenerating(true)
    setGenerationError(null)

    try {
      await api.post('/ai/generate-lessons', {
        syllabus_id: syllabus.id,
      })
      router.push('/dashboard/lessons')
    } catch (error: any) {
      const message =
        error.response?.data?.detail || 'Failed to generate lessons. Please try again.'
      setGenerationError(typeof message === 'string' ? message : JSON.stringify(message))
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!syllabus) return null

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/syllabi"
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Syllabi
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{syllabus.name}</h1>
              {syllabus.ai_generated && (
                <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700">
                  AI Generated
                </span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-500">
              <span>{syllabus.subject}</span>
              <span>|</span>
              <span>{syllabus.grade_level}</span>
              <span>|</span>
              <span>{syllabus.curriculum_standard}</span>
              <span>|</span>
              <span>{syllabus.duration_weeks} weeks</span>
            </div>
          </div>

          <button
            onClick={generateLessons}
            disabled={generating}
            className="btn-primary gap-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating Lessons...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4" />
                Generate Lessons with AI
              </>
            )}
          </button>
        </div>

        {generationError && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {generationError}
          </div>
        )}

        {generating && (
          <div className="mt-4 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
            AI is generating lesson plans for each week. This may take a few minutes...
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Learning Objectives */}
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Learning Objectives
            </h2>
            <ul className="mt-4 space-y-2">
              {syllabus.learning_objectives.map((obj, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-medium text-primary-700">
                    {index + 1}
                  </span>
                  {obj}
                </li>
              ))}
            </ul>
          </div>

          {/* Weekly Breakdown */}
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Clock className="h-5 w-5 text-blue-600" />
              Weekly Breakdown
            </h2>
            <div className="mt-4 space-y-4">
              {syllabus.weekly_breakdown.map((week, index) => (
                <div key={index} className="rounded-lg border border-gray-100 p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
                      {week.week}
                    </span>
                    <h3 className="font-medium text-gray-900">{week.topic}</h3>
                  </div>
                  {week.subtopics && week.subtopics.length > 0 && (
                    <div className="mt-2 ml-11">
                      <p className="text-xs font-medium text-gray-500 uppercase">Subtopics</p>
                      <ul className="mt-1 space-y-0.5">
                        {week.subtopics.map((sub, i) => (
                          <li key={i} className="text-sm text-gray-600">- {sub}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {week.learning_goals && week.learning_goals.length > 0 && (
                    <div className="mt-2 ml-11">
                      <p className="text-xs font-medium text-gray-500 uppercase">Goals</p>
                      <ul className="mt-1 space-y-0.5">
                        {week.learning_goals.map((goal, i) => (
                          <li key={i} className="text-sm text-gray-600">- {goal}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assessment Plan */}
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <ClipboardList className="h-5 w-5 text-orange-600" />
              Assessment Plan
            </h2>
            <div className="mt-4 space-y-3">
              {syllabus.assessment_plan.map((assessment, index) => (
                <div key={index} className="rounded-lg bg-gray-50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">Week {assessment.week}</span>
                    <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">
                      {assessment.type}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-gray-900">{assessment.title}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{assessment.description}</p>
                  {assessment.weight_percentage && (
                    <p className="mt-1 text-xs font-medium text-gray-600">
                      Weight: {assessment.weight_percentage}%
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Resources */}
          {syllabus.resources && syllabus.resources.length > 0 && (
            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <BookOpen className="h-5 w-5 text-purple-600" />
                Resources
              </h2>
              <div className="mt-4 space-y-2">
                {syllabus.resources.map((resource: any, index: number) => (
                  <div key={index} className="text-sm">
                    <p className="font-medium text-gray-900">{resource.title}</p>
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
