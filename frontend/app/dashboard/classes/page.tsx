'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { canAccess } from '@/lib/roles'
import api from '@/lib/api'
import { Plus, BookOpen, Loader2, Settings } from 'lucide-react'

interface ClassSubjectItem {
  id: number
  subject_id: number
  subject: {
    id: number
    name: string
    code: string
  } | null
}

interface ClassItem {
  id: number
  name: string
  subject: string | null
  grade_level: string
  academic_year: string
  term: string | null
  section: string | null
  max_students: number
  is_active: boolean
  class_subjects: ClassSubjectItem[]
  created_at: string
}

export default function ClassesPage() {
  const { user } = useAuth()
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [loading, setLoading] = useState(true)
  const canCreate = canAccess(user?.role || '', 'classes:create')

  useEffect(() => {
    async function fetchClasses() {
      try {
        const response = await api.get('/classes/')
        setClasses(response.data)
      } catch {
        // Will show empty state
      } finally {
        setLoading(false)
      }
    }
    fetchClasses()
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
          <h1 className="text-2xl font-bold text-gray-900">
            {canCreate ? 'Classes' : 'My Classes'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {canCreate ? 'Manage your classes and assign subjects' : 'View your enrolled classes'}
          </p>
        </div>
        {canCreate && (
          <Link href="/dashboard/classes/create" className="btn-primary gap-2">
            <Plus className="h-4 w-4" />
            Create Class
          </Link>
        )}
      </div>

      {classes.length === 0 ? (
        <div className="rounded-xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-gray-100">
          <BookOpen className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No classes yet</h3>
          <p className="mt-2 text-sm text-gray-500">
            {canCreate ? 'Create your first class to get started.' : 'No classes have been assigned to you yet.'}
          </p>
          {canCreate && (
            <Link href="/dashboard/classes/create" className="btn-primary mt-6 inline-flex gap-2">
              <Plus className="h-4 w-4" />
              Create Class
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
                  <BookOpen className="h-5 w-5 text-primary-600" />
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      cls.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {cls.is_active ? 'Active' : 'Inactive'}
                  </span>
                  {canCreate && (
                    <Link
                      href={`/dashboard/classes/${cls.id}/subjects`}
                      className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      title="Manage subjects"
                    >
                      <Settings className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              </div>
              <h3 className="mt-3 text-base font-semibold text-gray-900">{cls.name}</h3>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-500">
                  <span className="font-medium text-gray-700">Grade:</span> {cls.grade_level}
                </p>
                <p className="text-sm text-gray-500">
                  <span className="font-medium text-gray-700">Year:</span> {cls.academic_year}
                  {cls.term && ` - ${cls.term}`}
                </p>
              </div>

              {/* Subject badges */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {cls.class_subjects && cls.class_subjects.length > 0 ? (
                  cls.class_subjects.map((cs) => (
                    <span
                      key={cs.id}
                      className="inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700"
                    >
                      {cs.subject?.name || 'Unknown'}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400">No subjects assigned</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
