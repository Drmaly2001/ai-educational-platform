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

const subjectSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  code: z.string().min(1, 'Code is required').max(50),
  description: z.string().optional(),
})

type SubjectFormData = z.infer<typeof subjectSchema>

export default function CreateSubjectPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [apiError, setApiError] = useState<string | null>(null)

  if (!canAccess(user?.role || '', 'subjects:manage')) {
    return (
      <div className="rounded-xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-gray-100">
        <ShieldAlert className="mx-auto h-12 w-12 text-red-300" />
        <h3 className="mt-4 text-lg font-semibold text-gray-900">Access Denied</h3>
        <p className="mt-2 text-sm text-gray-500">You don&apos;t have permission to create subjects.</p>
        <Link href="/dashboard" className="btn-primary mt-6 inline-flex">Back to Dashboard</Link>
      </div>
    )
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SubjectFormData>({
    resolver: zodResolver(subjectSchema),
  })

  async function onSubmit(data: SubjectFormData) {
    setApiError(null)
    try {
      await api.post('/subjects/', {
        ...data,
        school_id: user?.school_id || 1,
      })
      router.push('/dashboard/subjects')
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to create subject.'
      setApiError(typeof message === 'string' ? message : JSON.stringify(message))
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard/subjects"
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Subjects
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create Subject</h1>
        <p className="mt-1 text-sm text-gray-500">Add a new subject to your school</p>
      </div>

      <div className="max-w-2xl rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
        {apiError && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{apiError}</div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-700">Subject Name</label>
            <input
              id="name"
              type="text"
              placeholder="e.g., Mathematics"
              className={`block w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.name ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
              }`}
              {...register('name')}
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="code" className="mb-1.5 block text-sm font-medium text-gray-700">Subject Code</label>
            <input
              id="code"
              type="text"
              placeholder="e.g., MATH, PHY, ENG"
              className={`block w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.code ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
              }`}
              {...register('code')}
            />
            {errors.code && <p className="mt-1 text-xs text-red-600">{errors.code.message}</p>}
          </div>

          <div>
            <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-gray-700">Description (optional)</label>
            <textarea
              id="description"
              rows={3}
              placeholder="Brief description of the subject"
              className="block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              {...register('description')}
            />
          </div>

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
                'Create Subject'
              )}
            </button>
            <Link href="/dashboard/subjects" className="btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
