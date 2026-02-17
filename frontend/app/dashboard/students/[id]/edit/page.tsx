'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { canAccess } from '@/lib/roles'
import api from '@/lib/api'
import { UserCheck, Loader2, ShieldAlert, ChevronLeft, Save } from 'lucide-react'
import Link from 'next/link'

type Tab = 'personal' | 'contact' | 'academic' | 'notes'

interface StudentData {
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
}

export default function EditStudentPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const studentId = params.id as string
  const [activeTab, setActiveTab] = useState<Tab>('personal')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    student_number: '',
    grade_level: '',
    enrollment_date: '',
    academic_year: '',
    date_of_birth: '',
    gender: '',
    phone: '',
    address: '',
    city: '',
    parent_name: '',
    parent_phone: '',
    parent_email: '',
    parent_relationship: '',
    health_notes: '',
    special_needs: '',
    additional_notes: '',
    is_active: true,
  })

  useEffect(() => {
    async function loadStudent() {
      try {
        const res = await api.get<StudentData>(`/students/${studentId}`)
        const s = res.data
        const p = s.student_profile
        setForm({
          full_name: s.full_name,
          email: s.email,
          student_number: p?.student_number || '',
          grade_level: p?.grade_level || '',
          enrollment_date: p?.enrollment_date || '',
          academic_year: p?.academic_year || '',
          date_of_birth: p?.date_of_birth || '',
          gender: p?.gender || '',
          phone: p?.phone || '',
          address: p?.address || '',
          city: p?.city || '',
          parent_name: p?.parent_name || '',
          parent_phone: p?.parent_phone || '',
          parent_email: p?.parent_email || '',
          parent_relationship: p?.parent_relationship || '',
          health_notes: p?.health_notes || '',
          special_needs: p?.special_needs || '',
          additional_notes: p?.additional_notes || '',
          is_active: s.is_active,
        })
      } catch {
        setError('Failed to load student.')
      } finally {
        setLoading(false)
      }
    }
    loadStudent()
  }, [studentId])

  if (!canAccess(user?.role || '', 'students:edit')) {
    return (
      <div className="rounded-xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-gray-100">
        <ShieldAlert className="mx-auto h-12 w-12 text-red-300" />
        <h3 className="mt-4 text-lg font-semibold text-gray-900">Access Denied</h3>
        <p className="mt-2 text-sm text-gray-500">You don&apos;t have permission to edit students.</p>
        <Link href="/dashboard/students" className="btn-primary mt-6 inline-flex">Back to Students</Link>
      </div>
    )
  }

  const set = (field: string, value: string | boolean) => setForm(f => ({ ...f, [field]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await api.put(`/students/${studentId}`, {
        full_name: form.full_name || undefined,
        email: form.email || undefined,
        is_active: form.is_active,
        student_number: form.student_number || undefined,
        grade_level: form.grade_level || undefined,
        enrollment_date: form.enrollment_date || undefined,
        academic_year: form.academic_year || undefined,
        date_of_birth: form.date_of_birth || undefined,
        gender: form.gender || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
        city: form.city || undefined,
        parent_name: form.parent_name || undefined,
        parent_phone: form.parent_phone || undefined,
        parent_email: form.parent_email || undefined,
        parent_relationship: form.parent_relationship || undefined,
        health_notes: form.health_notes || undefined,
        special_needs: form.special_needs || undefined,
        additional_notes: form.additional_notes || undefined,
      })
      router.push(`/dashboard/students/${studentId}`)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } }
      setError(e?.response?.data?.detail || 'Failed to update student.')
    } finally {
      setSaving(false)
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'personal', label: 'Personal Info' },
    { id: 'contact', label: 'Contact & Parent' },
    { id: 'academic', label: 'Academic' },
    { id: 'notes', label: 'Notes' },
  ]

  const grades = ['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6',
                  'Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12']

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/students/${studentId}`} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100">
            <UserCheck className="h-5 w-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Edit Student</h1>
            <p className="text-sm text-gray-500">{form.full_name}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
          <div className="border-b border-gray-100">
            <div className="flex overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap px-5 py-3.5 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'border-b-2 border-teal-600 text-teal-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 space-y-4">
            {activeTab === 'personal' && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Full Name</label>
                  <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" type="text" value={form.full_name} onChange={e => set('full_name', e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                  <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Date of Birth</label>
                  <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Gender</label>
                  <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" value={form.gender} onChange={e => set('gender', e.target.value)}>
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="sm:col-span-2 flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">Active Status</label>
                  <button
                    type="button"
                    onClick={() => set('is_active', !form.is_active)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.is_active ? 'bg-teal-600' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                  <span className="text-sm text-gray-500">{form.is_active ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            )}

            {activeTab === 'contact' && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
                  <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">City</label>
                  <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" type="text" value={form.city} onChange={e => set('city', e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Address</label>
                  <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" type="text" value={form.address} onChange={e => set('address', e.target.value)} />
                </div>
                <div className="sm:col-span-2 border-t border-gray-100 pt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Parent / Guardian</p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Parent Name</label>
                  <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" type="text" value={form.parent_name} onChange={e => set('parent_name', e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Relationship</label>
                  <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" value={form.parent_relationship} onChange={e => set('parent_relationship', e.target.value)}>
                    <option value="">Select</option>
                    <option value="father">Father</option>
                    <option value="mother">Mother</option>
                    <option value="guardian">Guardian</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Parent Phone</label>
                  <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" type="tel" value={form.parent_phone} onChange={e => set('parent_phone', e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Parent Email</label>
                  <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" type="email" value={form.parent_email} onChange={e => set('parent_email', e.target.value)} />
                </div>
              </div>
            )}

            {activeTab === 'academic' && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Student Number / ID</label>
                  <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" type="text" value={form.student_number} onChange={e => set('student_number', e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Grade Level</label>
                  <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" value={form.grade_level} onChange={e => set('grade_level', e.target.value)}>
                    <option value="">Select grade</option>
                    {grades.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Enrollment Date</label>
                  <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" type="date" value={form.enrollment_date} onChange={e => set('enrollment_date', e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Academic Year</label>
                  <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" type="text" value={form.academic_year} onChange={e => set('academic_year', e.target.value)} placeholder="e.g. 2024-2025" />
                </div>
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Health Notes</label>
                  <textarea className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" rows={3} value={form.health_notes} onChange={e => set('health_notes', e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Special Needs</label>
                  <textarea className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" rows={3} value={form.special_needs} onChange={e => set('special_needs', e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Additional Notes</label>
                  <textarea className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" rows={3} value={form.additional_notes} onChange={e => set('additional_notes', e.target.value)} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4">
          <Link href={`/dashboard/students/${studentId}`} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
