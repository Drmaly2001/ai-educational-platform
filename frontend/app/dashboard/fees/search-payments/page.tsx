'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import { canAccess } from '@/lib/roles'
import api from '@/lib/api'
import Link from 'next/link'
import { Search, Loader2, ShieldAlert, Receipt } from 'lucide-react'

interface Payment {
  id: number
  student_id: number
  amount: number
  payment_method: string
  payment_date: string
  receipt_number: string | null
  transaction_id: string | null
  is_verified: boolean
  student_name: string | null
  created_at: string
}

export default function SearchPaymentsPage() {
  const { user } = useAuth()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [filters, setFilters] = useState({ student_id: '', payment_method: '', date_from: '', date_to: '' })

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
      if (filters.payment_method) params.append('payment_method', filters.payment_method)
      if (filters.date_from) params.append('date_from', filters.date_from)
      if (filters.date_to) params.append('date_to', filters.date_to)
      const res = await api.get(`/fees/payments/?${params.toString()}`)
      setPayments(res.data)
    } catch { setPayments([]) } finally { setLoading(false) }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Search Payments</h1>
        <p className="mt-1 text-sm text-gray-500">Search and view fee payment records</p>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-2 gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:grid-cols-5">
        <div>
          <label className="block text-xs font-medium text-gray-700">Student ID</label>
          <input type="number" value={filters.student_id} onChange={e => setFilters({ ...filters, student_id: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="ID" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">Payment Method</label>
          <select value={filters.payment_method} onChange={e => setFilters({ ...filters, payment_method: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">All</option>
            <option value="cash">Cash</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="online">Online</option>
            <option value="cheque">Cheque</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">From Date</label>
          <input type="date" value={filters.date_from} onChange={e => setFilters({ ...filters, date_from: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">To Date</label>
          <input type="date" value={filters.date_to} onChange={e => setFilters({ ...filters, date_to: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div className="flex items-end">
          <button onClick={handleSearch} disabled={loading} className="btn-primary w-full gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Search
          </button>
        </div>
      </div>

      {searched && payments.length === 0 && !loading && (
        <div className="rounded-xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-gray-100">
          <Receipt className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No payments found</h3>
          <p className="mt-2 text-sm text-gray-500">Try adjusting your search filters.</p>
        </div>
      )}

      {payments.length > 0 && (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Receipt</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Student</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Method</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Verified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-xs font-mono text-gray-600">{p.receipt_number || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{p.student_name || `Student #${p.student_id}`}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">${p.amount.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className="inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                      {p.payment_method.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(p.payment_date).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${p.is_verified ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                      {p.is_verified ? 'Yes' : 'Pending'}
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
