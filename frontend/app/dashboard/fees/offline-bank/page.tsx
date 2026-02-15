'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { canAccess } from '@/lib/roles'
import api from '@/lib/api'
import Link from 'next/link'
import { Building, Loader2, ShieldAlert, CheckCircle, XCircle } from 'lucide-react'

interface OfflinePayment {
  id: number
  student_id: number
  amount: number
  payment_method: string
  payment_date: string
  bank_name: string | null
  transaction_id: string | null
  cheque_number: string | null
  is_verified: boolean
  student_name: string | null
  receipt_number: string | null
}

export default function OfflineBankPage() {
  const { user } = useAuth()
  const [payments, setPayments] = useState<OfflinePayment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  if (!canAccess(user?.role || '', 'fees:manage')) {
    return (
      <div className="rounded-xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-gray-100">
        <ShieldAlert className="mx-auto h-12 w-12 text-red-300" />
        <h3 className="mt-4 text-lg font-semibold text-gray-900">Access Denied</h3>
        <Link href="/dashboard" className="btn-primary mt-6 inline-flex">Back to Dashboard</Link>
      </div>
    )
  }

  useEffect(() => { fetchPayments() }, [])

  async function fetchPayments() {
    try {
      const res = await api.get('/fees/offline-bank-payments/')
      setPayments(res.data)
    } catch { /* empty */ } finally { setLoading(false) }
  }

  async function handleVerify(id: number, verified: boolean) {
    setError('')
    setSuccess('')
    try {
      await api.put(`/fees/offline-bank-payments/${id}/verify`, { is_verified: verified })
      setSuccess(verified ? 'Payment verified successfully!' : 'Payment rejected.')
      fetchPayments()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to verify payment')
    }
  }

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Offline Bank Payments</h1>
        <p className="mt-1 text-sm text-gray-500">Review and verify offline bank payment submissions</p>
      </div>

      {success && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          <CheckCircle className="h-4 w-4" /> {success}
        </div>
      )}
      {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {payments.length === 0 ? (
        <div className="rounded-xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-gray-100">
          <Building className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No pending verifications</h3>
          <p className="mt-2 text-sm text-gray-500">All offline bank payments have been processed.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Student</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Bank</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Transaction ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Date</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900">{p.student_name || `Student #${p.student_id}`}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">${p.amount.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{p.bank_name || '—'}</td>
                  <td className="px-6 py-4 text-xs font-mono text-gray-600">{p.transaction_id || p.cheque_number || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(p.payment_date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleVerify(p.id, true)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100">
                        <CheckCircle className="h-3.5 w-3.5" /> Verify
                      </button>
                      <button onClick={() => handleVerify(p.id, false)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100">
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </button>
                    </div>
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
