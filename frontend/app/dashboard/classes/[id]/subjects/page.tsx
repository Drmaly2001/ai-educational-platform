'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Loader2, Trash2, BookOpen } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import api from '@/lib/api'

interface Subject {
  id: number
  name: string
  code: string
  is_active: boolean
}

interface ClassSubject {
  id: number
  class_id: number
  subject_id: number
  teacher_id: number | null
  subject: Subject | null
}

interface ClassInfo {
  id: number
  name: string
  grade_level: string
  academic_year: string
}

export default function ClassSubjectsPage() {
  const params = useParams()
  const classId = params.id as string
  const { user } = useAuth()

  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null)
  const [assignedSubjects, setAssignedSubjects] = useState<ClassSubject[]>([])
  const [allSubjects, setAllSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('')

  useEffect(() => {
    fetchData()
  }, [classId])

  async function fetchData() {
    try {
      const [classRes, subjectsRes, assignedRes] = await Promise.all([
        api.get(`/classes/${classId}`),
        api.get('/subjects/'),
        api.get(`/classes/${classId}/subjects`),
      ])
      setClassInfo(classRes.data)
      setAllSubjects(subjectsRes.data)
      setAssignedSubjects(assignedRes.data)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const assignedSubjectIds = new Set(assignedSubjects.map((cs) => cs.subject_id))
  const availableSubjects = allSubjects.filter((s) => !assignedSubjectIds.has(s.id) && s.is_active)

  async function assignSubject() {
    if (!selectedSubjectId) return
    setAssigning(true)
    try {
      await api.post(`/classes/${classId}/subjects`, {
        subject_id: parseInt(selectedSubjectId),
      })
      setSelectedSubjectId('')
      await fetchData()
    } catch (error: any) {
      console.error('Failed to assign subject:', error)
    } finally {
      setAssigning(false)
    }
  }

  async function removeSubject(subjectId: number) {
    if (!confirm('Remove this subject from the class?')) return
    try {
      await api.delete(`/classes/${classId}/subjects/${subjectId}`)
      await fetchData()
    } catch (error) {
      console.error('Failed to remove subject:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
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
        <h1 className="text-2xl font-bold text-gray-900">
          Manage Subjects — {classInfo?.name}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {classInfo?.grade_level} | {classInfo?.academic_year}
        </p>
      </div>

      {/* Assign Subject */}
      <div className="mb-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <h2 className="mb-4 text-base font-semibold text-gray-900">Assign a Subject</h2>

        {availableSubjects.length === 0 ? (
          <p className="text-sm text-gray-500">
            {allSubjects.length === 0
              ? 'No subjects created yet. '
              : 'All subjects are already assigned. '}
            <Link href="/dashboard/subjects/create" className="text-primary-600 hover:text-primary-700 font-medium">
              Create a new subject
            </Link>
          </p>
        ) : (
          <div className="flex items-center gap-3">
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="block w-full max-w-sm rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select a subject...</option>
              {availableSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
            <button
              onClick={assignSubject}
              disabled={!selectedSubjectId || assigning}
              className="btn-primary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {assigning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Assign
            </button>
          </div>
        )}
      </div>

      {/* Assigned Subjects List */}
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            Assigned Subjects ({assignedSubjects.length})
          </h2>
        </div>

        {assignedSubjects.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">No subjects assigned to this class yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {assignedSubjects.map((cs) => (
              <li key={cs.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{cs.subject?.name}</p>
                    <p className="text-xs text-gray-500">Code: {cs.subject?.code}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeSubject(cs.subject_id)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  title="Remove subject"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6">
        <Link href="/dashboard/classes" className="btn-secondary">
          Done
        </Link>
      </div>
    </div>
  )
}
