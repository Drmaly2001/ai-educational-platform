'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Loader2, ShieldAlert } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { canAccess } from '@/lib/roles'
import api from '@/lib/api'

const classSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  grade_level: z.string().min(1, 'Grade level is required'),
  academic_year: z.string().min(4, 'Academic year is required'),
  term: z.string().optional(),
  section: z.string().optional(),
  max_students: z.coerce.number().min(1, 'Must allow at least 1 student'),
})

type ClassFormData = z.infer<typeof classSchema>

export default function CreateClassPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [apiError, setApiError] = useState<string | null>(null)

  if (!canAccess(user?.role || '', 'classes:create')) {
    return (
      <div className="rounded-xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-gray-100">
        <ShieldAlert className="mx-auto h-12 w-12 text-red-300" />
        <h3 className="mt-4 text-lg font-semibold text-gray-900">Access Denied</h3>
        <p className="mt-2 text-sm text-gray-500">You don&apos;t have permission to create classes.</p>
        <Link href="/dashboard" className="btn-primary mt-6 inline-flex">Back to Dashboard</Link>
      </div>
    )
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ClassFormData>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      academic_year: '2025-2026',
      max_students: 30,
    },
  })

  async function onSubmit(data: ClassFormData) {
    setApiError(null)

    try {
      const res = await api.post('/classes/', {
        ...data,
        school_id: user?.school_id || 1,
      })
      router.push(`/dashboard/classes/${res.data.id}/subjects`)
    } catch (error: any) {
      const message =
        error.response?.data?.detail || 'Failed to create class. Please try again.'
      setApiError(typeof message === 'string' ? message : JSON.stringify(message))
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard/classes"
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Classes
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create Class</h1>
        <p className="mt-1 text-sm text-gray-500">Set up a new class, then assign subjects to it</p>
      </div>

      <div className="max-w-2xl rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
        {apiError && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Name */}
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-700">
              Class Name
            </label>
            <input
              id="name"
              type="text"
              placeholder="e.g., Grade 10A"
              className={`block w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.name ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
              }`}
              {...register('name')}
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </div>

          {/* Grade Level & Academic Year */}
          <div className="grid gap-4 sm:grid-cols-2">
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

            <div>
              <label htmlFor="academic_year" className="mb-1.5 block text-sm font-medium text-gray-700">
                Academic Year
              </label>
              <select
                id="academic_year"
                className={`block w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.academic_year ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                }`}
                {...register('academic_year')}
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - 1 + i
                  const value = `${year}-${year + 1}`
                  return (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  )
                })}
              </select>
              {errors.academic_year && <p className="mt-1 text-xs text-red-600">{errors.academic_year.message}</p>}
            </div>
          </div>

          {/* Term & Section */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="term" className="mb-1.5 block text-sm font-medium text-gray-700">
                Term (optional)
              </label>
              <select
                id="term"
                className="block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                {...register('term')}
              >
                <option value="">Select term</option>
                <option value="Term 1">Term 1</option>
                <option value="Term 2">Term 2</option>
                <option value="Term 3">Term 3</option>
                <option value="Semester 1">Semester 1</option>
                <option value="Semester 2">Semester 2</option>
                <option value="Full Year">Full Year</option>
              </select>
            </div>

            <div>
              <label htmlFor="section" className="mb-1.5 block text-sm font-medium text-gray-700">
                Section (optional)
              </label>
              <input
                id="section"
                type="text"
                placeholder="e.g., A, B, C"
                className="block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                {...register('section')}
              />
            </div>
          </div>

          {/* Max Students */}
          <div className="max-w-xs">
            <label htmlFor="max_students" className="mb-1.5 block text-sm font-medium text-gray-700">
              Max Students
            </label>
            <input
              id="max_students"
              type="number"
              min={1}
              className={`block w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.max_students ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
              }`}
              {...register('max_students')}
            />
            {errors.max_students && <p className="mt-1 text-xs text-red-600">{errors.max_students.message}</p>}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Class & Assign Subjects'
              )}
            </button>
            <Link href="/dashboard/classes" className="btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
