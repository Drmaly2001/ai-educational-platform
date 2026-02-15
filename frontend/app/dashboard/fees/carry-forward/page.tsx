'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import { canAccess } from '@/lib/roles'
import api from '@/lib/api'
import Link from 'next/link'
import { ArrowRightLeft, Loader2, ShieldAlert, CheckCircle, Eye } from 'lucide-react'

interface PreviewItem {
  student_id: number
  student_name: string
  total_balance: number
  items_count: number
}

export default function CarryForwardPage() {
  const { user } = useAuth()
  const [form, setForm] = useState({ from_academic_year: '', to_academic_year: '' })
  const [preview, setPreview] = useState<PreviewItem[]>([])
  const [loading, setLoading] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [previewed, setPreviewed] = useState(false)

  if (!canAccess(user?.role || '', 'fees:manage')) {
    return (
      <div className="rounded-xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-gray-100">
        <ShieldAlert className="mx-auto h-12 w-12 text-red-300" />
        <h3 className="mt-4 text-lg font-semibold text-gray-900">Access Denied</h3>
        <Link href="/dashboard" className="btn-primary mt-6 inline-flex">Back to Dashboard</Link>
      </div>
    )
  }

  async function handlePreview() {
    if (!form.from_academic_year || !form.to_academic_year) {
      setError('Please select both academic years')
      return
    }
    setLoading(true)
    setError('')
    setSuccess('')
    setPreviewed(true)
    try {
      const params = new URLSearchParams({ from_academic_year: form.from_academic_year, to_academic_year: form.to_academic_year })
      const res = await api.get(`/fees/carry-forward/preview?${params.toString()}`)
      setPreview(res.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load preview')
      setPreview([])
    } finally { setLoading(false) }
  }

  async function handleExecute() {
    if (!confirm('Are you sure you want to carry forward all unpaid balances? This action cannot be undone.')) return
    setExecuting(true)
    setError('')
    try {
      await api.post('/fees/carry-forward/', {
        school_id: user?.school_id || 1,
        from_academic_year: form.from_academic_year,
        to_academic_year: form.to_academic_year,
      })
      setSuccess('Fees carried forward successfully!')
      setPreview([])
      setPreviewed(false)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to carry forward')
    } finally { setExecuting(false) }
  }

  const totalBalance = preview.reduce((sum, p) => sum + p.total_balance, 0)

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Fees Carry Forward</h1>
        <p className="mt-1 text-sm text-gray-500">Carry unpaid fee balances from one academic year to another</p>
      </div>

      {success && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          <CheckCircle className="h-4 w-4" /> {success}
        </div>
      )}
      {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="mb-6 grid grid-cols-3 gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
        <div>
          <label className="block text-xs font-medium text-gray-700">From Academic Year *</label>
          <select required value={form.from_academic_year} onChange={e => setForm({ ...form, from_academic_year: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">Select</option>
            <option value="2024-2025">2024-2025</option>
            <option value="2025-2026">2025-2026</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">To Academic Year *</label>
          <select required value={form.to_academic_year} onChange={e => setForm({ ...form, to_academic_year: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">Select</option>
            <option value="2025-2026">2025-2026</option>
            <option value="2026-2027">2026-2027</option>
          </select>
        </div>
        <div className="flex items-end">
          <button onClick={handlePreview} disabled={loading} className="btn-primary w-full gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
            Preview
          </button>
        </div>
      </div>

      {previewed && preview.length === 0 && !loading && (
        <div className="rounded-xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-gray-100">
          <ArrowRightLeft className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No unpaid balances</h3>
          <p className="mt-2 text-sm text-gray-500">No fees to carry forward for the selected period.</p>
        </div>
      )}

      {preview.length > 0 && (
        <>
          <div className="mb-4 rounded-lg bg-amber-50 p-3 text-sm font-medium text-amber-700">
            Total to carry forward: ${totalBalance.toFixed(2)} for {preview.length} student(s)
          </div>
          <div className="mb-4 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Unpaid Items</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Total Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {preview.map(p => (
                  <tr key={p.student_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{p.student_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{p.items_count}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-red-600">${p.total_balance.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={handleExecute} disabled={executing} className="btn-primary w-full gap-2">
            {executing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRightLeft className="h-4 w-4" />}
            Carry Forward All
          </button>
        </>
      )}
    </div>
  )
}
