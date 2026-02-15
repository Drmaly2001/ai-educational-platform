'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { canAccess } from '@/lib/roles'
import api from '@/lib/api'
import Link from 'next/link'
import { Zap, Loader2, ShieldAlert, CheckCircle } from 'lucide-react'

interface Option { id: number; name: string }
interface ClassOption { id: number; name: string; section: string }

export default function QuickFeesPage() {
  const { user } = useAuth()
  const [masters, setMasters] = useState<Option[]>([])
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [discounts, setDiscounts] = useState<Option[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState({ fees_master_id: '', class_id: '', student_ids: '', discount_id: '' })

  if (!canAccess(user?.role || '', 'fees:manage')) {
    return (
      <div className="rounded-xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-gray-100">
        <ShieldAlert className="mx-auto h-12 w-12 text-red-300" />
        <h3 className="mt-4 text-lg font-semibold text-gray-900">Access Denied</h3>
        <Link href="/dashboard" className="btn-primary mt-6 inline-flex">Back to Dashboard</Link>
      </div>
    )
  }

  useEffect(() => {
    async function loadOptions() {
      try {
        const [m, c, d] = await Promise.all([
          api.get('/fees/masters/'),
          api.get('/classes/'),
          api.get('/fees/discounts/'),
        ])
        setMasters(m.data.map((x: any) => ({ id: x.id, name: `${x.fees_group_name || 'Group'} - ${x.fees_type_name || 'Type'} ($${x.amount})` })))
        setClasses(c.data)
        setDiscounts(d.data)
      } catch { /* empty */ }
    }
    loadOptions()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const payload: any = {
        school_id: user?.school_id || 1,
        fees_master_id: parseInt(form.fees_master_id),
      }
      if (form.class_id) payload.class_id = parseInt(form.class_id)
      if (form.student_ids) payload.student_ids = form.student_ids.split(',').map((s: string) => parseInt(s.trim()))
      if (form.discount_id) payload.discount_id = parseInt(form.discount_id)

      const res = await api.post('/fees/quick-assign/', payload)
      setSuccess(`Successfully assigned fees to ${res.data.assigned_count} student(s)!`)
      setForm({ fees_master_id: '', class_id: '', student_ids: '', discount_id: '' })
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to assign fees')
    } finally { setLoading(false) }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quick Fees Assignment</h1>
        <p className="mt-1 text-sm text-gray-500">Bulk assign fees to an entire class or specific students</p>
      </div>

      {success && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          <CheckCircle className="h-4 w-4" /> {success}
        </div>
      )}
      {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <div>
          <label className="block text-sm font-medium text-gray-700">Fee Master *</label>
          <select required value={form.fees_master_id} onChange={e => setForm({ ...form, fees_master_id: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">Select Fee Master</option>
            {masters.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Assign to Class</label>
          <select value={form.class_id} onChange={e => setForm({ ...form, class_id: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">Select Class (optional)</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Or Specific Student IDs</label>
          <input type="text" value={form.student_ids} onChange={e => setForm({ ...form, student_ids: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Comma-separated IDs: 1, 2, 3" />
          <p className="mt-1 text-xs text-gray-400">Leave empty if assigning to a class</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Apply Discount</label>
          <select value={form.discount_id} onChange={e => setForm({ ...form, discount_id: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">No Discount</option>
            {discounts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          Assign Fees
        </button>
      </form>
    </div>
  )
}
