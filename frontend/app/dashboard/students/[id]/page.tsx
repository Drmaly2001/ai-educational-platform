'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import api from '@/lib/api'
import {
  UserCheck, Loader2, ChevronLeft, Pencil, BookOpen,
  Phone, Mail, MapPin, User, GraduationCap, Activity, BarChart3
} from 'lucide-react'
import Link from 'next/link'

type Tab = 'profile' | 'classes' | 'activity' | 'progress'

interface StudentDetail {
  id: number
  full_name: string
  email: string
  is_active: boolean
  student_profile: {
    student_number: string | null
    grade_level: string | null
    enrollment_date: string | null
    academic_year: string | null
    date_of_birth: string | null
    gender: string | null
    phone: string | null
    address: string | null
    city: string | null
    parent_name: string | null
    parent_phone: string | null
    parent_email: string | null
    parent_relationship: string | null
    health_notes: string | null
    special_needs: string | null
    additional_notes: string | null
  } | null
  enrollments: Array<{
    id: number
    class_id: number
    status: string
    enrolled_at: string
  }>
}

interface ActivityItem {
  id: number
  activity_type: string
  lesson_id: number | null
  class_id: number | null
  score: number | null
  max_score: number | null
  progress_percent: number | null
  notes: string | null
  created_at: string
}

interface ProgressItem {
  class_id: number
  class_name: string
  lessons_viewed: number
  total_lessons: number
  avg_score: number | null
  progress_percent: number | null
}

export default function StudentDetailPage() {
  const { user } = useAuth()
  const params = useParams()
  const studentId = params.id as string
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [student, setStudent] = useState<StudentDetail | null>(null)
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [progress, setProgress] = useState<ProgressItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStudent()
  }, [studentId])

  useEffect(() => {
    if (activeTab === 'activity' && activities.length === 0) fetchActivities()
    if (activeTab === 'progress' && progress.length === 0) fetchProgress()
  }, [activeTab])

  async function fetchStudent() {
    try {
      const res = await api.get(`/students/${studentId}`)
      setStudent(res.data)
    } catch {
      // not found
    } finally {
      setLoading(false)
    }
  }

  async function fetchActivities() {
    try {
      const res = await api.get(`/students/${studentId}/activities`)
      setActivities(res.data)
    } catch {
      // ignore
    }
  }

  async function fetchProgress() {
    try {
      const res = await api.get(`/students/${studentId}/progress`)
      setProgress(res.data)
    } catch {
      // ignore
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
    </div>
  )

  if (!student) return (
    <div className="rounded-xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-gray-100">
      <UserCheck className="mx-auto h-12 w-12 text-gray-300" />
      <h3 className="mt-4 text-base font-semibold text-gray-900">Student not found</h3>
      <Link href="/dashboard/students" className="mt-4 inline-flex items-center gap-2 text-sm text-teal-600 hover:underline">
        <ChevronLeft className="h-4 w-4" /> Back to Students
      </Link>
    </div>
  )

  const p = student.student_profile

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'classes', label: 'Classes', icon: BookOpen },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'progress', label: 'Progress', icon: BarChart3 },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/students" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-100 text-2xl font-bold text-teal-700">
            {student.full_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{student.full_name}</h1>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${student.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {student.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-0.5">
              {p?.student_number && <span className="text-sm text-gray-500">ID: {p.student_number}</span>}
              {p?.grade_level && <span className="text-sm text-gray-500">{p.grade_level}</span>}
              <span className="text-sm text-gray-400">{student.email}</span>
            </div>
          </div>
        </div>
        <Link
          href={`/dashboard/students/${student.id}/edit`}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          <Pencil className="h-4 w-4" /> Edit
        </Link>
      </div>

      {/* Tabs */}
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
        <div className="border-b border-gray-100">
          <div className="flex overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap px-5 py-3.5 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-teal-600 text-teal-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && p && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <User className="h-4 w-4 text-teal-500" /> Personal Information
                </h3>
                <dl className="space-y-2">
                  {[
                    { label: 'Date of Birth', value: p.date_of_birth },
                    { label: 'Gender', value: p.gender },
                    { label: 'Academic Year', value: p.academic_year },
                    { label: 'Enrollment Date', value: p.enrollment_date },
                  ].map(item => item.value && (
                    <div key={item.label} className="flex justify-between py-1.5 border-b border-gray-50 text-sm">
                      <dt className="text-gray-500">{item.label}</dt>
                      <dd className="font-medium text-gray-800 capitalize">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-teal-500" /> Contact
                </h3>
                <dl className="space-y-2">
                  {[
                    { label: 'Phone', value: p.phone },
                    { label: 'City', value: p.city },
                    { label: 'Address', value: p.address },
                  ].map(item => item.value && (
                    <div key={item.label} className="flex justify-between py-1.5 border-b border-gray-50 text-sm">
                      <dt className="text-gray-500">{item.label}</dt>
                      <dd className="font-medium text-gray-800">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {(p.parent_name || p.parent_phone) && (
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-teal-500" /> Parent / Guardian
                  </h3>
                  <dl className="space-y-2">
                    {[
                      { label: 'Name', value: p.parent_name },
                      { label: 'Relationship', value: p.parent_relationship },
                      { label: 'Phone', value: p.parent_phone },
                      { label: 'Email', value: p.parent_email },
                    ].map(item => item.value && (
                      <div key={item.label} className="flex justify-between py-1.5 border-b border-gray-50 text-sm">
                        <dt className="text-gray-500">{item.label}</dt>
                        <dd className="font-medium text-gray-800 capitalize">{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {(p.health_notes || p.special_needs || p.additional_notes) && (
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-teal-500" /> Notes
                  </h3>
                  {p.health_notes && (
                    <div className="mb-2">
                      <p className="text-xs font-medium text-gray-400 uppercase mb-1">Health</p>
                      <p className="text-sm text-gray-700">{p.health_notes}</p>
                    </div>
                  )}
                  {p.special_needs && (
                    <div className="mb-2">
                      <p className="text-xs font-medium text-gray-400 uppercase mb-1">Special Needs</p>
                      <p className="text-sm text-gray-700">{p.special_needs}</p>
                    </div>
                  )}
                  {p.additional_notes && (
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase mb-1">Additional</p>
                      <p className="text-sm text-gray-700">{p.additional_notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && !p && (
            <div className="py-8 text-center text-gray-400 text-sm">No profile data available.</div>
          )}

          {/* Classes Tab */}
          {activeTab === 'classes' && (
            <div>
              {student.enrollments.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-sm">
                  <GraduationCap className="mx-auto h-8 w-8 mb-2 text-gray-300" />
                  Not enrolled in any classes yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {student.enrollments.map(e => (
                    <div key={e.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                          <BookOpen className="h-4 w-4 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Class #{e.class_id}</p>
                          <p className="text-xs text-gray-400">Enrolled {new Date(e.enrolled_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${e.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {e.status}
                        </span>
                        <Link href={`/dashboard/classes/${e.class_id}`} className="text-sm text-teal-600 hover:underline">View</Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div>
              {activities.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-sm">
                  <Activity className="mx-auto h-8 w-8 mb-2 text-gray-300" />
                  No activity recorded yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {activities.map(a => (
                    <div key={a.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3 text-sm">
                      <div>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium mr-2 ${
                          a.activity_type === 'lesson_view' ? 'bg-blue-100 text-blue-700' :
                          a.activity_type === 'assessment_score' ? 'bg-amber-100 text-amber-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {a.activity_type.replace('_', ' ')}
                        </span>
                        {a.score !== null && a.max_score !== null && (
                          <span className="text-gray-600">Score: {a.score}/{a.max_score}</span>
                        )}
                        {a.progress_percent !== null && (
                          <span className="text-gray-600">Progress: {a.progress_percent}%</span>
                        )}
                        {a.notes && <span className="text-gray-500 ml-2">{a.notes}</span>}
                      </div>
                      <span className="text-xs text-gray-400">{new Date(a.created_at).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Progress Tab */}
          {activeTab === 'progress' && (
            <div>
              {progress.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-sm">
                  <BarChart3 className="mx-auto h-8 w-8 mb-2 text-gray-300" />
                  No progress data yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {progress.map(p => (
                    <div key={p.class_id} className="rounded-lg border border-gray-100 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">{p.class_name || `Class #${p.class_id}`}</h4>
                        {p.avg_score !== null && (
                          <span className="text-sm font-semibold text-amber-600">Avg: {p.avg_score.toFixed(1)}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <BookOpen className="h-3.5 w-3.5" />
                        {p.lessons_viewed} / {p.total_lessons} lessons viewed
                      </div>
                      {p.total_lessons > 0 && (
                        <div className="w-full rounded-full bg-gray-100 h-2">
                          <div
                            className="h-2 rounded-full bg-teal-500 transition-all"
                            style={{ width: `${Math.round((p.lessons_viewed / p.total_lessons) * 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
