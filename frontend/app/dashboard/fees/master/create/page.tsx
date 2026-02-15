'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import api from '@/lib/api'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'

interface Option { id: number; name: string }

export default function CreateFeesMasterPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [groups, setGroups] = useState<Option[]>([])
  const [types, setTypes] = useState<Option[]>([])
  const [form, setForm] = useState({
    fees_group_id: '', fees_type_id: '', amount: '', due_date: '', academic_year: '', term: ''
  })

  useEffect(() => {
    async function loadOptions() {
      try {
        const [g, t] = await Promise.all([api.get('/fees/groups/'), api.get('/fees/types/')])
        setGroups(g.data)
        setTypes(t.data)
      } catch { /* empty */ }
    }
    loadOptions()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post('/fees/masters/', {
        fees_group_id: parseInt(form.fees_group_id),
        fees_type_id: parseInt(form.fees_type_id),
        amount: parseFloat(form.amount),
        due_date: form.due_date || null,
        academic_year: form.academic_year,
        term: form.term || null,
        school_id: user?.school_id || 1,
      })
      router.push('/dashboard/fees/master')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create fee master')
    } finally { setLoading(false) }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/dashboard/fees/master" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Back to Fees Master
      </Link>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Create Fee Master</h1>
      {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Fee Group *</label>
            <select required value={form.fees_group_id} onChange={e => setForm({ ...form, fees_group_id: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Select Group</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Fee Type *</label>
            <select required value={form.fees_type_id} onChange={e => setForm({ ...form, fees_type_id: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Select Type</option>
              {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Amount *</label>
            <input type="number" required step="0.01" min="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., 5000" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Due Date</label>
            <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Academic Year *</label>
            <select required value={form.academic_year} onChange={e => setForm({ ...form, academic_year: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Select Year</option>
              <option value="2024-2025">2024-2025</option>
              <option value="2025-2026">2025-2026</option>
              <option value="2026-2027">2026-2027</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Term</label>
            <input type="text" value={form.term} onChange={e => setForm({ ...form, term: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., Term 1" />
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Create Fee Master
        </button>
      </form>
    </div>
  )
}
