'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { canAccess } from '@/lib/roles'
import api from '@/lib/api'
import { UserCheck, Loader2, ShieldAlert, ChevronLeft, Save, CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface ClassItem {
  id: number
  name: string
  grade_level: string
  section: string | null
  academic_year: string
  teacher_id: number | null
}

interface TeacherItem {
  id: number
  full_name: string
  email: string
}

export default function AssignClassTeacherPage() {
  const { user } = useAuth()
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [teachers, setTeachers] = useState<TeacherItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSection, setSelectedSection] = useState('')
  const [selectedTeacher, setSelectedTeacher] = useState<number | null>(null)

  useEffect(() => {
    Promise.all([
      api.get('/classes/'),
      api.get('/users/?role=teacher'),
    ]).then(([classRes, teacherRes]) => {
      setClasses(classRes.data)
      setTeachers(teacherRes.data)
    }).catch(() => {
      setError('Failed to load data.')
    }).finally(() => setLoading(false))
  }, [])

  if (!canAccess(user?.role || '', 'classes:edit')) {
    return (
      <div className="rounded-xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-gray-100">
        <ShieldAlert className="mx-auto h-12 w-12 text-red-300" />
        <h3 className="mt-4 text-lg font-semibold text-gray-900">Access Denied</h3>
        <p className="mt-2 text-sm text-gray-500">You don&apos;t have permission to assign teachers.</p>
        <Link href="/dashboard/classes" className="mt-6 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Back to Classes</Link>
      </div>
    )
  }

  // Get unique sections for selected class
  const selectedClassData = classes.find(c => String(c.id) === selectedClass)

  // Filter classes by section if selected
  const filteredClasses = selectedSection
    ? classes.filter(c => c.section === selectedSection)
    : classes

  // Unique sections across all classes
  const allSections = Array.from(new Set(classes.map(c => c.section).filter(Boolean))) as string[]

  // The class to assign (either by id or first match in filtered)
  const targetClass = selectedClass
    ? classes.find(c => String(c.id) === selectedClass)
    : null

  // Pre-select current teacher when class changes
  useEffect(() => {
    if (targetClass?.teacher_id) {
      setSelectedTeacher(targetClass.teacher_id)
    } else {
      setSelectedTeacher(null)
    }
  }, [selectedClass])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!selectedClass) { setError('Please select a class.'); return }
    if (!selectedTeacher) { setError('Please select a teacher.'); return }
    setSaving(true)
    try {
      await api.put(`/classes/${selectedClass}`, { teacher_id: selectedTeacher })
      const teacherName = teachers.find(t => t.id === selectedTeacher)?.full_name
      setSuccess(`Teacher "${teacherName}" assigned successfully to ${targetClass?.name}.`)
      // Refresh classes
      const res = await api.get('/classes/')
      setClasses(res.data)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } }
      setError(e?.response?.data?.detail || 'Failed to assign teacher.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
    </div>
  )

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/classes" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
            <UserCheck className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Assign Class Teacher</h1>
            <p className="text-sm text-gray-500">Assign a teacher to a class</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-100 divide-y divide-gray-100">

          {/* Success */}
          {success && (
            <div className="flex items-center gap-2 px-6 py-4 bg-green-50 rounded-t-xl">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="px-6 py-4 bg-red-50 rounded-t-xl">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Section Filter */}
          <div className="px-6 py-5">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Section <span className="text-gray-400 font-normal">(optional filter)</span>
            </label>
            <select
              value={selectedSection}
              onChange={e => { setSelectedSection(e.target.value); setSelectedClass('') }}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Sections</option>
              {allSections.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Class Select */}
          <div className="px-6 py-5">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Class <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select</option>
              {filteredClasses.map(cls => (
                <option key={cls.id} value={String(cls.id)}>
                  {cls.name} {cls.section ? `— Section ${cls.section}` : ''} ({cls.grade_level})
                </option>
              ))}
            </select>
            {targetClass?.teacher_id && (
              <p className="mt-1.5 text-xs text-gray-400">
                Current teacher: <span className="font-medium text-gray-600">
                  {teachers.find(t => t.id === targetClass.teacher_id)?.full_name || `ID ${targetClass.teacher_id}`}
                </span>
              </p>
            )}
          </div>

          {/* Teacher List */}
          <div className="px-6 py-5">
            <label className="mb-3 block text-sm font-medium text-gray-700">
              Class Teacher <span className="text-red-500">*</span>
            </label>
            {teachers.length === 0 ? (
              <p className="text-sm text-gray-400">No teachers found in your school.</p>
            ) : (
              <div className="space-y-2">
                {teachers.map(teacher => (
                  <label
                    key={teacher.id}
                    className={`flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors ${
                      selectedTeacher === teacher.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="teacher"
                      value={teacher.id}
                      checked={selectedTeacher === teacher.id}
                      onChange={() => setSelectedTeacher(teacher.id)}
                      className="h-4 w-4 text-blue-600"
                    />
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700 flex-shrink-0">
                        {teacher.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {teacher.full_name}
                          <span className="ml-1.5 text-gray-400 font-normal">({teacher.id})</span>
                        </p>
                        <p className="text-xs text-gray-400">{teacher.email}</p>
                      </div>
                    </div>
                    {selectedTeacher === teacher.id && (
                      <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 px-6 py-4">
            <Link href="/dashboard/classes" className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving || !selectedClass || !selectedTeacher}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Saving...' : 'Assign Teacher'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
