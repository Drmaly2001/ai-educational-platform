'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { canAccess } from '@/lib/roles'
import api from '@/lib/api'
import {
  Users, Loader2, ChevronLeft, UserPlus, UserMinus, Search, BookOpen, X
} from 'lucide-react'
import Link from 'next/link'

interface EnrolledStudent {
  enrollment_id: number
  student_id: number
  student_name: string
  student_email: string
  student_number: string | null
  grade_level: string | null
  enrolled_at: string
  status: string
  lessons_viewed: number
  total_lessons: number
}

interface AvailableStudent {
  id: number
  full_name: string
  email: string
  student_profile: { student_number: string | null; grade_level: string | null } | null
}

export default function ClassStudentsPage() {
  const { user } = useAuth()
  const params = useParams()
  const classId = params.id as string

  const [enrolled, setEnrolled] = useState<EnrolledStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [allStudents, setAllStudents] = useState<AvailableStudent[]>([])
  const [modalSearch, setModalSearch] = useState('')
  const [enrolling, setEnrolling] = useState<number | null>(null)
  const [unenrolling, setUnenrolling] = useState<number | null>(null)

  useEffect(() => {
    fetchEnrolled()
  }, [classId])

  async function fetchEnrolled() {
    try {
      setLoading(true)
      const res = await api.get(`/classes/${classId}/students`)
      setEnrolled(res.data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  async function openEnrollModal() {
    try {
      const res = await api.get('/students/')
      setAllStudents(res.data)
    } catch {
      setAllStudents([])
    }
    setModalSearch('')
    setShowModal(true)
  }

  async function enrollStudent(studentId: number) {
    setEnrolling(studentId)
    try {
      await api.post(`/classes/${classId}/students`, { student_id: studentId })
      await fetchEnrolled()
      setShowModal(false)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } }
      alert(e?.response?.data?.detail || 'Failed to enroll student.')
    } finally {
      setEnrolling(null)
    }
  }

  async function unenrollStudent(studentId: number) {
    if (!confirm('Remove this student from the class?')) return
    setUnenrolling(studentId)
    try {
      await api.delete(`/classes/${classId}/students/${studentId}`)
      setEnrolled(prev => prev.filter(e => e.student_id !== studentId))
    } catch {
      alert('Failed to unenroll student.')
    } finally {
      setUnenrolling(null)
    }
  }

  const enrolledIds = new Set(enrolled.map(e => e.student_id))
  const availableForEnroll = allStudents.filter(s =>
    !enrolledIds.has(s.id) && (
      s.full_name.toLowerCase().includes(modalSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(modalSearch.toLowerCase()) ||
      (s.student_profile?.student_number || '').toLowerCase().includes(modalSearch.toLowerCase())
    )
  )

  const canManage = canAccess(user?.role || '', 'students:create')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/classes/${classId}`} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Class Students</h1>
            <p className="text-sm text-gray-500">{enrolled.length} enrolled student{enrolled.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        {canManage && (
          <button
            onClick={openEnrollModal}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <UserPlus className="h-4 w-4" />
            Enroll Student
          </button>
        )}
      </div>

      {/* Student List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : enrolled.length === 0 ? (
        <div className="rounded-xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-gray-100">
          <Users className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-base font-semibold text-gray-900">No students enrolled</h3>
          <p className="mt-1 text-sm text-gray-500">Enroll students to track their progress.</p>
          {canManage && (
            <button onClick={openEnrollModal} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              <UserPlus className="h-4 w-4" /> Enroll Student
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-500">Student</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">ID</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Grade</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Progress</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Enrolled</th>
                {canManage && <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {enrolled.map(e => {
                const pct = e.total_lessons > 0 ? Math.round((e.lessons_viewed / e.total_lessons) * 100) : 0
                return (
                  <tr key={e.enrollment_id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-700">
                          {e.student_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <Link href={`/dashboard/students/${e.student_id}`} className="font-medium text-gray-900 hover:text-teal-600">
                            {e.student_name}
                          </Link>
                          <p className="text-xs text-gray-400">{e.student_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{e.student_number || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 text-gray-600">{e.grade_level || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 rounded-full bg-gray-100 h-1.5">
                          <div className="h-1.5 rounded-full bg-teal-500" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">{e.lessons_viewed}/{e.total_lessons}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{new Date(e.enrolled_at).toLocaleDateString()}</td>
                    {canManage && (
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => unenrollStudent(e.student_id)}
                          disabled={unenrolling === e.student_id}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                          title="Unenroll"
                        >
                          {unenrolling === e.student_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Enroll Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="text-base font-semibold text-gray-900">Enroll a Student</h2>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-5 pt-4 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={modalSearch}
                  onChange={e => setModalSearch(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none"
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-72 overflow-y-auto px-5 py-2">
              {availableForEnroll.length === 0 ? (
                <div className="py-6 text-center text-sm text-gray-400">
                  <BookOpen className="mx-auto h-6 w-6 mb-1 text-gray-300" />
                  {allStudents.length === 0 ? 'No students available.' : 'All students already enrolled or no matches.'}
                </div>
              ) : availableForEnroll.map(s => (
                <div key={s.id} className="flex items-center justify-between rounded-lg px-2 py-2.5 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-700">
                      {s.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{s.full_name}</p>
                      <p className="text-xs text-gray-400">{s.email} {s.student_profile?.grade_level ? `• ${s.student_profile.grade_level}` : ''}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => enrollStudent(s.id)}
                    disabled={enrolling === s.id}
                    className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {enrolling === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                    Enroll
                  </button>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 px-5 py-3">
              <button onClick={() => setShowModal(false)} className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
