'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { canAccess } from '@/lib/roles'
import api from '@/lib/api'
import { UserCheck, Loader2, ShieldAlert, ChevronLeft, Save } from 'lucide-react'
import Link from 'next/link'

type Tab = 'personal' | 'contact' | 'academic' | 'notes'

export default function CreateStudentPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('personal')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
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
  })

  if (!canAccess(user?.role || '', 'students:create')) {
    return (
      <div className="rounded-xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-gray-100">
        <ShieldAlert className="mx-auto h-12 w-12 text-red-300" />
        <h3 className="mt-4 text-lg font-semibold text-gray-900">Access Denied</h3>
        <p className="mt-2 text-sm text-gray-500">You don&apos;t have permission to create students.</p>
        <Link href="/dashboard/students" className="btn-primary mt-6 inline-flex">Back to Students</Link>
      </div>
    )
  }

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.full_name || !form.email || !form.password) {
      setError('Full name, email, and password are required.')
      return
    }
    setSaving(true)
    try {
      await api.post('/students/', {
        full_name: form.full_name,
        email: form.email,
        password: form.password,
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
      router.push('/dashboard/students')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } }
      setError(e?.response?.data?.detail || 'Failed to create student.')
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/students" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100">
            <UserCheck className="h-5 w-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Add Student</h1>
            <p className="text-sm text-gray-500">Create a new student account with profile</p>
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
                  <label className="mb-1 block text-sm font-medium text-gray-700">Full Name <span className="text-red-500">*</span></label>
                  <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" type="text" value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Student full name" required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Email <span className="text-red-500">*</span></label>
                  <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="student@school.com" required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Password <span className="text-red-500">*</span></label>
                  <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Initial password" required />
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
              </div>
            )}

            {activeTab === 'contact' && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
                  <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+1234567890" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">City</label>
                  <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" type="text" value={form.city} onChange={e => set('city', e.target.value)} placeholder="City" />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Address</label>
                  <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" type="text" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Full address" />
                </div>
                <div className="sm:col-span-2 border-t border-gray-100 pt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Parent / Guardian</p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Parent Name</label>
                  <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" type="text" value={form.parent_name} onChange={e => set('parent_name', e.target.value)} placeholder="Parent name" />
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
                  <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" type="tel" value={form.parent_phone} onChange={e => set('parent_phone', e.target.value)} placeholder="+1234567890" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Parent Email</label>
                  <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" type="email" value={form.parent_email} onChange={e => set('parent_email', e.target.value)} placeholder="parent@email.com" />
                </div>
              </div>
            )}

            {activeTab === 'academic' && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Student Number / ID</label>
                  <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" type="text" value={form.student_number} onChange={e => set('student_number', e.target.value)} placeholder="e.g. STU-2024-001" />
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
                  <textarea className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" rows={3} value={form.health_notes} onChange={e => set('health_notes', e.target.value)} placeholder="Any health conditions or allergies..." />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Special Needs</label>
                  <textarea className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" rows={3} value={form.special_needs} onChange={e => set('special_needs', e.target.value)} placeholder="Learning disabilities, accommodations needed..." />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Additional Notes</label>
                  <textarea className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" rows={3} value={form.additional_notes} onChange={e => set('additional_notes', e.target.value)} placeholder="Any other relevant information..." />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4">
          <Link href="/dashboard/students" className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving...' : 'Create Student'}
          </button>
        </div>
      </form>
    </div>
  )
}
