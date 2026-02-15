'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Brain, Loader2, Sparkles, X, ShieldAlert } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { canAccess } from '@/lib/roles'
import api from '@/lib/api'

const generateSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  grade_level: z.string().min(1, 'Grade level is required'),
  curriculum_standard: z.string().min(1, 'Curriculum standard is required'),
  duration_weeks: z.coerce.number().min(1).max(52, 'Duration must be 1-52 weeks'),
  additional_instructions: z.string().optional(),
})

type GenerateFormData = z.infer<typeof generateSchema>

export default function GenerateSyllabusPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [apiError, setApiError] = useState<string | null>(null)
  const [objectives, setObjectives] = useState<string[]>([])
  const [objectiveInput, setObjectiveInput] = useState('')

  if (!canAccess(user?.role || '', 'syllabi:generate')) {
    return (
      <div className="rounded-xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-gray-100">
        <ShieldAlert className="mx-auto h-12 w-12 text-red-300" />
        <h3 className="mt-4 text-lg font-semibold text-gray-900">Access Denied</h3>
        <p className="mt-2 text-sm text-gray-500">You don&apos;t have permission to generate syllabi.</p>
        <Link href="/dashboard" className="btn-primary mt-6 inline-flex">Back to Dashboard</Link>
      </div>
    )
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GenerateFormData>({
    resolver: zodResolver(generateSchema),
    defaultValues: {
      duration_weeks: 12,
    },
  })

  function addObjective() {
    const trimmed = objectiveInput.trim()
    if (trimmed && !objectives.includes(trimmed)) {
      setObjectives([...objectives, trimmed])
      setObjectiveInput('')
    }
  }

  function removeObjective(index: number) {
    setObjectives(objectives.filter((_, i) => i !== index))
  }

  async function onSubmit(data: GenerateFormData) {
    setApiError(null)

    try {
      const response = await api.post('/ai/generate-syllabus', {
        ...data,
        school_id: user?.school_id || 1,
        learning_objectives: objectives.length > 0 ? objectives : undefined,
      })

      router.push(`/dashboard/syllabi/${response.data.id}`)
    } catch (error: any) {
      const message =
        error.response?.data?.detail || 'Failed to generate syllabus. Please try again.'
      setApiError(typeof message === 'string' ? message : JSON.stringify(message))
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard/syllabi"
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Syllabi
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
            <Brain className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Generate Syllabus with AI</h1>
            <p className="text-sm text-gray-500">Let AI create a comprehensive syllabus for your course</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
        {apiError && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Subject & Grade Level */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="subject" className="mb-1.5 block text-sm font-medium text-gray-700">
                Subject
              </label>
              <input
                id="subject"
                type="text"
                placeholder="e.g., Mathematics"
                className={`block w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.subject ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                }`}
                {...register('subject')}
              />
              {errors.subject && <p className="mt-1 text-xs text-red-600">{errors.subject.message}</p>}
            </div>

            <div>
              <label htmlFor="grade_level" className="mb-1.5 block text-sm font-medium text-gray-700">
                Grade Level
              </label>
              <select
                id="grade_level"
                className={`block w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.grade_level ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                }`}
                {...register('grade_level')}
              >
                <option value="">Select grade level</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={`Grade ${i + 1}`}>
                    Grade {i + 1}
                  </option>
                ))}
                <option value="A-Level">A-Level</option>
                <option value="IB">IB</option>
                <option value="AP">AP</option>
              </select>
              {errors.grade_level && <p className="mt-1 text-xs text-red-600">{errors.grade_level.message}</p>}
            </div>
          </div>

          {/* Curriculum Standard & Duration */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="curriculum_standard" className="mb-1.5 block text-sm font-medium text-gray-700">
                Curriculum Standard
              </label>
              <select
                id="curriculum_standard"
                className={`block w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.curriculum_standard ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                }`}
                {...register('curriculum_standard')}
              >
                <option value="">Select standard</option>
                <option value="IGCSE">IGCSE</option>
                <option value="IB">IB</option>
                <option value="Common Core">Common Core</option>
                <option value="A-Level">A-Level</option>
                <option value="AP">AP</option>
                <option value="CBSE">CBSE</option>
                <option value="National">National</option>
                <option value="Other">Other</option>
              </select>
              {errors.curriculum_standard && (
                <p className="mt-1 text-xs text-red-600">{errors.curriculum_standard.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="duration_weeks" className="mb-1.5 block text-sm font-medium text-gray-700">
                Duration (weeks)
              </label>
              <input
                id="duration_weeks"
                type="number"
                min={1}
                max={52}
                className={`block w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.duration_weeks ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                }`}
                {...register('duration_weeks')}
              />
              {errors.duration_weeks && <p className="mt-1 text-xs text-red-600">{errors.duration_weeks.message}</p>}
            </div>
          </div>

          {/* Learning Objectives */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Learning Objectives (optional)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={objectiveInput}
                onChange={(e) => setObjectiveInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addObjective()
                  }
                }}
                placeholder="Type an objective and press Enter"
                className="block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="button"
                onClick={addObjective}
                className="btn-secondary shrink-0"
              >
                Add
              </button>
            </div>
            {objectives.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {objectives.map((obj, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700"
                  >
                    {obj}
                    <button
                      type="button"
                      onClick={() => removeObjective(index)}
                      className="ml-0.5 text-primary-400 hover:text-primary-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Additional Instructions */}
          <div>
            <label htmlFor="additional_instructions" className="mb-1.5 block text-sm font-medium text-gray-700">
              Additional Instructions (optional)
            </label>
            <textarea
              id="additional_instructions"
              rows={3}
              placeholder="e.g., Focus on practical applications, include project-based learning..."
              className="block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              {...register('additional_instructions')}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary gap-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating with AI...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Syllabus
                </>
              )}
            </button>
            <Link href="/dashboard/syllabi" className="btn-secondary">
              Cancel
            </Link>
          </div>

          {isSubmitting && (
            <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
              AI is generating your syllabus. This may take a moment...
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
