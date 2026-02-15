'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import { canAccess } from '@/lib/roles'
import api from '@/lib/api'
import Link from 'next/link'
import { Search, Loader2, ShieldAlert, Clock } from 'lucide-react'

interface DueFee {
  id: number
  student_id: number
  total_amount: number
  paid_amount: number
  balance: number
  status: string
  due_date: string | null
  student_name: string | null
  fees_type_name: string | null
  fees_group_name: string | null
}

export default function SearchDueFeesPage() {
  const { user } = useAuth()
  const [dues, setDues] = useState<DueFee[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [filters, setFilters] = useState({ student_id: '', status: '', academic_year: '' })

  if (!canAccess(user?.role || '', 'fees:manage')) {
    return (
      <div className="rounded-xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-gray-100">
        <ShieldAlert className="mx-auto h-12 w-12 text-red-300" />
        <h3 className="mt-4 text-lg font-semibold text-gray-900">Access Denied</h3>
        <Link href="/dashboard" className="btn-primary mt-6 inline-flex">Back to Dashboard</Link>
      </div>
    )
  }

  async function handleSearch() {
    setLoading(true)
    setSearched(true)
    try {
      const params = new URLSearchParams()
      if (filters.student_id) params.append('student_id', filters.student_id)
      if (filters.status) params.append('status', filters.status)
      if (filters.academic_year) params.append('academic_year', filters.academic_year)
      const res = await api.get(`/fees/due/?${params.toString()}`)
      setDues(res.data)
    } catch { setDues([]) } finally { setLoading(false) }
  }

  const totalDue = dues.reduce((sum, d) => sum + d.balance, 0)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Search Due Fees</h1>
        <p className="mt-1 text-sm text-gray-500">Find students with outstanding fee balances</p>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-2 gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:grid-cols-4">
        <div>
          <label className="block text-xs font-medium text-gray-700">Student ID</label>
          <input type="number" value={filters.student_id} onChange={e => setFilters({ ...filters, student_id: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="ID" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">Status</label>
          <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">All</option>
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partial</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">Academic Year</label>
          <select value={filters.academic_year} onChange={e => setFilters({ ...filters, academic_year: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">All</option>
            <option value="2024-2025">2024-2025</option>
            <option value="2025-2026">2025-2026</option>
            <option value="2026-2027">2026-2027</option>
          </select>
        </div>
        <div className="flex items-end">
          <button onClick={handleSearch} disabled={loading} className="btn-primary w-full gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Search
          </button>
        </div>
      </div>

      {searched && dues.length > 0 && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">
          Total Outstanding: ${totalDue.toFixed(2)} across {dues.length} record(s)
        </div>
      )}

      {searched && dues.length === 0 && !loading && (
        <div className="rounded-xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-gray-100">
          <Clock className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No due fees found</h3>
          <p className="mt-2 text-sm text-gray-500">Try adjusting your filters.</p>
        </div>
      )}

      {dues.length > 0 && (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Student</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Fee</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Total</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Paid</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Balance</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dues.map(d => (
                <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900">{d.student_name || `Student #${d.student_id}`}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{d.fees_group_name} - {d.fees_type_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">${d.total_amount.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-green-600">${d.paid_amount.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-red-600">${d.balance.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{d.due_date ? new Date(d.due_date).toLocaleDateString() : '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      d.status === 'partial' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                    </span>
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
