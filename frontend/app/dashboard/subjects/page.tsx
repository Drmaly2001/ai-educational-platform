'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Loader2, BookOpen, ShieldAlert } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { canAccess } from '@/lib/roles'
import api from '@/lib/api'

interface Subject {
  id: number
  name: string
  code: string
  description: string | null
  is_active: boolean
  created_at: string
}

export default function SubjectsPage() {
  const { user } = useAuth()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSubjects()
  }, [])

  async function fetchSubjects() {
    try {
      const res = await api.get('/subjects/')
      setSubjects(res.data)
    } catch (error) {
      console.error('Failed to fetch subjects:', error)
    } finally {
      setLoading(false)
    }
  }

  async function toggleActive(subject: Subject) {
    try {
      await api.put(`/subjects/${subject.id}`, { is_active: !subject.is_active })
      fetchSubjects()
    } catch (error) {
      console.error('Failed to update subject:', error)
    }
  }

  async function deleteSubject(id: number) {
    if (!confirm('Are you sure you want to delete this subject?')) return
    try {
      await api.delete(`/subjects/${id}`)
      fetchSubjects()
    } catch (error) {
      console.error('Failed to delete subject:', error)
    }
  }

  if (!canAccess(user?.role || '', 'subjects:manage')) {
    return (
      <div className="rounded-xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-gray-100">
        <ShieldAlert className="mx-auto h-12 w-12 text-red-300" />
        <h3 className="mt-4 text-lg font-semibold text-gray-900">Access Denied</h3>
        <p className="mt-2 text-sm text-gray-500">You don&apos;t have permission to manage subjects.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subjects</h1>
          <p className="mt-1 text-sm text-gray-500">Manage subjects for your school</p>
        </div>
        <Link
          href="/dashboard/subjects/create"
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Subject
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : subjects.length === 0 ? (
        <div className="rounded-xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-gray-100">
          <BookOpen className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No subjects yet</h3>
          <p className="mt-2 text-sm text-gray-500">Create subjects to assign them to classes.</p>
          <Link href="/dashboard/subjects/create" className="btn-primary mt-6 inline-flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Subject
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Code</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Description</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {subjects.map((subject) => (
                <tr key={subject.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{subject.name}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{subject.code}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{subject.description || '—'}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      subject.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {subject.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    <button
                      onClick={() => toggleActive(subject)}
                      className="mr-3 text-gray-500 hover:text-gray-700"
                    >
                      {subject.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => deleteSubject(subject.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
