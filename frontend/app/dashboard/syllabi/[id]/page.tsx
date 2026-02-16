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
  GraduationCap,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Target,
  Lightbulb,
  Calendar,
  Award,
  HelpCircle,
  Eye,
  EyeOff,
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
  detailed_assessment_plan: any | null
  exam_preparation: any | null
  is_published: boolean
  ai_generated: boolean
  created_at: string
}

type TabType = 'weekly' | 'assessment' | 'exam-prep'

export default function SyllabusDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [syllabus, setSyllabus] = useState<SyllabusDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generatingAssessment, setGeneratingAssessment] = useState(false)
  const [generatingExamPrep, setGeneratingExamPrep] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('weekly')
  const [expandedAssessments, setExpandedAssessments] = useState<Set<number>>(new Set())
  const [showAnswers, setShowAnswers] = useState<Set<number>>(new Set())

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

  async function generateAssessmentPlan() {
    if (!syllabus) return
    setGeneratingAssessment(true)
    setGenerationError(null)

    try {
      const response = await api.post('/ai/generate-assessment-plan', {
        syllabus_id: syllabus.id,
      })
      setSyllabus(response.data)
      setActiveTab('assessment')
    } catch (error: any) {
      const message =
        error.response?.data?.detail || 'Failed to generate assessment plan. Please try again.'
      setGenerationError(typeof message === 'string' ? message : JSON.stringify(message))
    } finally {
      setGeneratingAssessment(false)
    }
  }

  async function generateExamPrep() {
    if (!syllabus) return
    setGeneratingExamPrep(true)
    setGenerationError(null)

    try {
      const response = await api.post('/ai/generate-exam-prep', {
        syllabus_id: syllabus.id,
      })
      setSyllabus(response.data)
      setActiveTab('exam-prep')
    } catch (error: any) {
      const message =
        error.response?.data?.detail || 'Failed to generate exam prep. Please try again.'
      setGenerationError(typeof message === 'string' ? message : JSON.stringify(message))
    } finally {
      setGeneratingExamPrep(false)
    }
  }

  function toggleAssessment(index: number) {
    setExpandedAssessments((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  function toggleAnswer(index: number) {
    setShowAnswers((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!syllabus) return null

  const tabs: { key: TabType; label: string; icon: any }[] = [
    { key: 'weekly', label: 'Weekly Breakdown', icon: Clock },
    { key: 'assessment', label: 'Assessment Plan', icon: ClipboardList },
    { key: 'exam-prep', label: 'Exam Preparation', icon: GraduationCap },
  ]

  const isGenerating = generating || generatingAssessment || generatingExamPrep

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

          {/* AI Generation Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={generateLessons}
              disabled={isGenerating}
              className="btn-primary gap-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4" />
                  Generate Lessons
                </>
              )}
            </button>
            <button
              onClick={generateAssessmentPlan}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {generatingAssessment ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <ClipboardList className="h-4 w-4" />
                  Assessment Plan
                </>
              )}
            </button>
            <button
              onClick={generateExamPrep}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {generatingExamPrep ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <GraduationCap className="h-4 w-4" />
                  Exam Prep
                </>
              )}
            </button>
          </div>
        </div>

        {generationError && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {generationError}
          </div>
        )}

        {isGenerating && (
          <div className="mt-4 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
            AI is generating content. This may take a few minutes...
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

          {/* Tab Navigation */}
          <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
            <div className="border-b border-gray-100">
              <nav className="flex">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.key
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                        isActive
                          ? 'border-primary-600 text-primary-700'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  )
                })}
              </nav>
            </div>

            <div className="p-6">
              {/* Weekly Breakdown Tab */}
              {activeTab === 'weekly' && (
                <div className="space-y-4">
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
              )}

              {/* Assessment Plan Tab */}
              {activeTab === 'assessment' && (
                <div>
                  {!syllabus.detailed_assessment_plan ? (
                    <div className="text-center py-12">
                      <ClipboardList className="mx-auto h-12 w-12 text-gray-300" />
                      <h3 className="mt-4 text-lg font-medium text-gray-900">No Detailed Assessment Plan Yet</h3>
                      <p className="mt-2 text-sm text-gray-500">
                        Generate a comprehensive assessment plan with questions, rubrics, and marking criteria.
                      </p>
                      <button
                        onClick={generateAssessmentPlan}
                        disabled={isGenerating}
                        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-60"
                      >
                        {generatingAssessment ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Brain className="h-4 w-4" />
                        )}
                        Generate Assessment Plan with AI
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Grading Policy */}
                      {syllabus.detailed_assessment_plan.grading_policy && (
                        <div className="rounded-lg bg-orange-50 p-4 mb-6">
                          <h3 className="font-medium text-orange-900 flex items-center gap-2">
                            <Award className="h-4 w-4" />
                            Grading Policy
                          </h3>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {Object.entries(
                              syllabus.detailed_assessment_plan.grading_policy.grade_boundaries || {}
                            ).map(([grade, min]: [string, any]) => (
                              <span
                                key={grade}
                                className="rounded-full bg-white px-3 py-1 text-xs font-medium text-orange-800 ring-1 ring-orange-200"
                              >
                                {grade}: {min}%+
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Assessments */}
                      {(syllabus.detailed_assessment_plan.assessments || []).map(
                        (assessment: any, index: number) => (
                          <div
                            key={index}
                            className="rounded-lg border border-gray-200 overflow-hidden"
                          >
                            {/* Assessment Header */}
                            <button
                              onClick={() => toggleAssessment(index)}
                              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                            >
                              <div className="flex items-center gap-3">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">
                                  W{assessment.week}
                                </span>
                                <div>
                                  <h4 className="font-medium text-gray-900">{assessment.title}</h4>
                                  <div className="mt-1 flex flex-wrap gap-2">
                                    <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">
                                      {assessment.type}
                                    </span>
                                    {assessment.weight_percentage && (
                                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                                        {assessment.weight_percentage}% weight
                                      </span>
                                    )}
                                    {assessment.duration_minutes && (
                                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                                        {assessment.duration_minutes} min
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {expandedAssessments.has(index) ? (
                                <ChevronDown className="h-5 w-5 text-gray-400" />
                              ) : (
                                <ChevronRight className="h-5 w-5 text-gray-400" />
                              )}
                            </button>

                            {/* Assessment Details (expanded) */}
                            {expandedAssessments.has(index) && (
                              <div className="p-4 space-y-4">
                                <p className="text-sm text-gray-600">{assessment.description}</p>

                                {/* Topics Covered */}
                                {assessment.topics_covered && assessment.topics_covered.length > 0 && (
                                  <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Topics Covered</p>
                                    <div className="flex flex-wrap gap-1">
                                      {assessment.topics_covered.map((topic: string, i: number) => (
                                        <span key={i} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700">
                                          {topic}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Instructions */}
                                {assessment.instructions_for_students && (
                                  <div className="rounded-lg bg-blue-50 p-3">
                                    <p className="text-xs font-medium text-blue-700 uppercase mb-1">Instructions for Students</p>
                                    <p className="text-sm text-blue-800">{assessment.instructions_for_students}</p>
                                  </div>
                                )}

                                {/* Allowed Materials */}
                                {assessment.allowed_materials && assessment.allowed_materials.length > 0 && (
                                  <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Allowed Materials</p>
                                    <div className="flex flex-wrap gap-1">
                                      {assessment.allowed_materials.map((m: string, i: number) => (
                                        <span key={i} className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs text-green-700">
                                          {m}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Questions */}
                                {assessment.questions && assessment.questions.length > 0 && (
                                  <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                                      Questions ({assessment.questions.length})
                                    </p>
                                    <div className="space-y-3">
                                      {assessment.questions.map((q: any, qi: number) => (
                                        <div key={qi} className="rounded-lg border border-gray-100 p-3">
                                          <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                              <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold text-gray-500">
                                                  Q{q.question_number || qi + 1}
                                                </span>
                                                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                                                  {q.question_type?.replace('_', ' ')}
                                                </span>
                                                <span className="text-xs text-gray-400">{q.marks} marks</span>
                                              </div>
                                              <p className="text-sm text-gray-800">{q.question_text}</p>
                                              {q.options && (
                                                <ul className="mt-2 space-y-1 ml-4">
                                                  {q.options.map((opt: string, oi: number) => (
                                                    <li key={oi} className="text-sm text-gray-600">{opt}</li>
                                                  ))}
                                                </ul>
                                              )}
                                            </div>
                                          </div>
                                          <div className="mt-2 border-t border-gray-100 pt-2">
                                            <p className="text-xs text-gray-500">
                                              <span className="font-medium">Answer:</span> {q.expected_answer}
                                            </p>
                                            {q.marking_criteria && (
                                              <p className="text-xs text-gray-400 mt-1">
                                                <span className="font-medium">Marking:</span> {q.marking_criteria}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Rubric */}
                                {assessment.rubric && assessment.rubric.criteria && (
                                  <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                                      Rubric (Total: {assessment.rubric.total_marks} marks)
                                    </p>
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-xs">
                                        <thead>
                                          <tr className="bg-gray-50">
                                            <th className="px-3 py-2 text-left font-medium text-gray-700">Criterion</th>
                                            <th className="px-3 py-2 text-left font-medium text-green-700">Excellent</th>
                                            <th className="px-3 py-2 text-left font-medium text-blue-700">Good</th>
                                            <th className="px-3 py-2 text-left font-medium text-yellow-700">Satisfactory</th>
                                            <th className="px-3 py-2 text-left font-medium text-red-700">Needs Improvement</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {assessment.rubric.criteria.map((c: any, ci: number) => (
                                            <tr key={ci} className="border-t border-gray-100">
                                              <td className="px-3 py-2 font-medium text-gray-800">{c.criterion}</td>
                                              <td className="px-3 py-2 text-gray-600">{c.excellent}</td>
                                              <td className="px-3 py-2 text-gray-600">{c.good}</td>
                                              <td className="px-3 py-2 text-gray-600">{c.satisfactory}</td>
                                              <td className="px-3 py-2 text-gray-600">{c.needs_improvement}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Exam Preparation Tab */}
              {activeTab === 'exam-prep' && (
                <div>
                  {!syllabus.exam_preparation ? (
                    <div className="text-center py-12">
                      <GraduationCap className="mx-auto h-12 w-12 text-gray-300" />
                      <h3 className="mt-4 text-lg font-medium text-gray-900">No Exam Prep Materials Yet</h3>
                      <p className="mt-2 text-sm text-gray-500">
                        Generate study guides, practice questions, revision plans, and exam tips.
                      </p>
                      <button
                        onClick={generateExamPrep}
                        disabled={isGenerating}
                        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-60"
                      >
                        {generatingExamPrep ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Brain className="h-4 w-4" />
                        )}
                        Generate Exam Prep with AI
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Study Guide */}
                      {syllabus.exam_preparation.study_guide && (
                        <div>
                          <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900 mb-3">
                            <BookOpen className="h-5 w-5 text-purple-600" />
                            Study Guide
                          </h3>

                          {syllabus.exam_preparation.study_guide.overview && (
                            <p className="text-sm text-gray-600 mb-4 bg-purple-50 p-3 rounded-lg">
                              {syllabus.exam_preparation.study_guide.overview}
                            </p>
                          )}

                          {/* Key Topics */}
                          {syllabus.exam_preparation.study_guide.key_topics && (
                            <div className="space-y-3 mb-4">
                              <p className="text-xs font-medium text-gray-500 uppercase">Key Topics</p>
                              {syllabus.exam_preparation.study_guide.key_topics.map(
                                (topic: any, i: number) => (
                                  <div key={i} className="rounded-lg border border-gray-100 p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-medium text-sm text-gray-900">{topic.topic}</h4>
                                      <span
                                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                          topic.importance === 'high'
                                            ? 'bg-red-50 text-red-700'
                                            : topic.importance === 'medium'
                                            ? 'bg-yellow-50 text-yellow-700'
                                            : 'bg-green-50 text-green-700'
                                        }`}
                                      >
                                        {topic.importance}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-600">{topic.summary}</p>
                                    {topic.key_concepts && topic.key_concepts.length > 0 && (
                                      <div className="mt-2 flex flex-wrap gap-1">
                                        {topic.key_concepts.map((c: string, ci: number) => (
                                          <span key={ci} className="rounded bg-primary-50 px-2 py-0.5 text-xs text-primary-700">
                                            {c}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                    {topic.common_mistakes && topic.common_mistakes.length > 0 && (
                                      <div className="mt-2">
                                        <p className="text-xs text-red-600 font-medium">Common Mistakes:</p>
                                        <ul className="mt-0.5 space-y-0.5">
                                          {topic.common_mistakes.map((m: string, mi: number) => (
                                            <li key={mi} className="text-xs text-red-500 flex items-start gap-1">
                                              <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                                              {m}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                )
                              )}
                            </div>
                          )}

                          {/* Key Formulas & Definitions */}
                          {syllabus.exam_preparation.study_guide.key_formulas_and_definitions &&
                            syllabus.exam_preparation.study_guide.key_formulas_and_definitions.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                                  Key Formulas & Definitions
                                </p>
                                <div className="grid gap-2 sm:grid-cols-2">
                                  {syllabus.exam_preparation.study_guide.key_formulas_and_definitions.map(
                                    (item: any, i: number) => (
                                      <div key={i} className="rounded-lg bg-gray-50 p-3">
                                        <p className="font-medium text-sm text-gray-900">{item.term}</p>
                                        <p className="text-sm text-gray-700 mt-0.5">{item.definition}</p>
                                        {item.when_to_use && (
                                          <p className="text-xs text-gray-400 mt-1">{item.when_to_use}</p>
                                        )}
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                        </div>
                      )}

                      {/* Practice Questions */}
                      {syllabus.exam_preparation.practice_questions &&
                        syllabus.exam_preparation.practice_questions.length > 0 && (
                          <div>
                            <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900 mb-3">
                              <HelpCircle className="h-5 w-5 text-blue-600" />
                              Practice Questions ({syllabus.exam_preparation.practice_questions.length})
                            </h3>
                            <div className="space-y-3">
                              {syllabus.exam_preparation.practice_questions.map(
                                (q: any, i: number) => (
                                  <div key={i} className="rounded-lg border border-gray-100 p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="text-xs font-bold text-gray-500">
                                        Q{q.question_number || i + 1}
                                      </span>
                                      <span
                                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                          q.difficulty === 'hard'
                                            ? 'bg-red-50 text-red-700'
                                            : q.difficulty === 'medium'
                                            ? 'bg-yellow-50 text-yellow-700'
                                            : 'bg-green-50 text-green-700'
                                        }`}
                                      >
                                        {q.difficulty}
                                      </span>
                                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                                        {q.question_type?.replace('_', ' ')}
                                      </span>
                                      <span className="text-xs text-gray-400">{q.marks} marks</span>
                                      <span className="text-xs text-gray-400 ml-auto">{q.topic}</span>
                                    </div>
                                    <p className="text-sm text-gray-800">{q.question}</p>
                                    {q.options && (
                                      <ul className="mt-2 space-y-1 ml-4">
                                        {q.options.map((opt: string, oi: number) => (
                                          <li key={oi} className="text-sm text-gray-600">{opt}</li>
                                        ))}
                                      </ul>
                                    )}
                                    <div className="mt-3">
                                      <button
                                        onClick={() => toggleAnswer(i)}
                                        className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
                                      >
                                        {showAnswers.has(i) ? (
                                          <>
                                            <EyeOff className="h-3 w-3" />
                                            Hide Answer
                                          </>
                                        ) : (
                                          <>
                                            <Eye className="h-3 w-3" />
                                            Show Answer
                                          </>
                                        )}
                                      </button>
                                      {showAnswers.has(i) && (
                                        <div className="mt-2 rounded-lg bg-green-50 p-3">
                                          <p className="text-sm text-green-800">{q.answer}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                      {/* Revision Plan */}
                      {syllabus.exam_preparation.revision_plan && (
                        <div>
                          <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900 mb-3">
                            <Calendar className="h-5 w-5 text-green-600" />
                            Revision Plan ({syllabus.exam_preparation.revision_plan.total_days} days)
                          </h3>
                          <div className="space-y-2">
                            {(syllabus.exam_preparation.revision_plan.daily_schedule || []).map(
                              (day: any, i: number) => (
                                <div key={i} className="flex gap-3 rounded-lg border border-gray-100 p-3">
                                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                                    D{day.day}
                                  </span>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <div className="flex flex-wrap gap-1">
                                        {(day.focus_topics || []).map((t: string, ti: number) => (
                                          <span key={ti} className="rounded bg-green-50 px-2 py-0.5 text-xs text-green-700">
                                            {t}
                                          </span>
                                        ))}
                                      </div>
                                      <span className="text-xs text-gray-400 ml-auto shrink-0">
                                        {day.duration_hours}h
                                      </span>
                                    </div>
                                    <ul className="mt-1 space-y-0.5">
                                      {(day.activities || []).map((a: string, ai: number) => (
                                        <li key={ai} className="text-xs text-gray-600">- {a}</li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                      {/* Exam Tips */}
                      {syllabus.exam_preparation.exam_tips &&
                        syllabus.exam_preparation.exam_tips.length > 0 && (
                          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                            <h3 className="flex items-center gap-2 text-base font-semibold text-amber-900 mb-3">
                              <Lightbulb className="h-5 w-5 text-amber-600" />
                              Exam Tips
                            </h3>
                            <ul className="space-y-2">
                              {syllabus.exam_preparation.exam_tips.map((tip: string, i: number) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                                  <Target className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
                                  {tip}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assessment Schedule (basic overview) */}
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <ClipboardList className="h-5 w-5 text-orange-600" />
              Assessment Schedule
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
