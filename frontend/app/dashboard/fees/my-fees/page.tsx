'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import api from '@/lib/api'
import { Wallet, Loader2, CheckCircle } from 'lucide-react'

interface MyFee {
  id: number
  total_amount: number
  paid_amount: number
  balance: number
  status: string
  due_date: string | null
  fees_type_name: string | null
  fees_group_name: string | null
  is_carried_forward: boolean
}

interface MyPayment {
  id: number
  amount: number
  payment_method: string
  payment_date: string
  receipt_number: string | null
  is_verified: boolean
}

export default function MyFeesPage() {
  const { user } = useAuth()
  const [fees, setFees] = useState<MyFee[]>([])
  const [payments, setPayments] = useState<MyPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'fees' | 'payments'>('fees')

  useEffect(() => {
    async function load() {
      if (!user?.id) return
      try {
        const [f, p] = await Promise.all([
          api.get(`/fees/due/student/${user.id}`),
          api.get(`/fees/payments/student/${user.id}`),
        ])
        setFees(f.data)
        setPayments(p.data)
      } catch { /* empty */ } finally { setLoading(false) }
    }
    load()
  }, [user?.id])

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>

  const totalDue = fees.reduce((sum, f) => sum + f.balance, 0)
  const totalPaid = fees.reduce((sum, f) => sum + f.paid_amount, 0)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Fees</h1>
        <p className="mt-1 text-sm text-gray-500">View your fee details and payment history</p>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <p className="text-xs font-medium text-gray-500">Total Fees</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">${fees.reduce((sum, f) => sum + f.total_amount, 0).toFixed(2)}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <p className="text-xs font-medium text-gray-500">Total Paid</p>
          <p className="mt-1 text-2xl font-bold text-green-600">${totalPaid.toFixed(2)}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <p className="text-xs font-medium text-gray-500">Balance Due</p>
          <p className="mt-1 text-2xl font-bold text-red-600">${totalDue.toFixed(2)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-lg bg-gray-100 p-1">
        <button onClick={() => setTab('fees')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${tab === 'fees' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          My Fees ({fees.length})
        </button>
        <button onClick={() => setTab('payments')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${tab === 'payments' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          Payment History ({payments.length})
        </button>
      </div>

      {tab === 'fees' && (
        fees.length === 0 ? (
          <div className="rounded-xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-gray-100">
            <CheckCircle className="mx-auto h-12 w-12 text-green-300" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">All Clear!</h3>
            <p className="mt-2 text-sm text-gray-500">You have no pending fees.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {fees.map(f => (
              <div key={f.id} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{f.fees_group_name} - {f.fees_type_name}</h3>
                    <div className="mt-1 flex gap-4 text-xs text-gray-500">
                      <span>Total: <strong>${f.total_amount.toFixed(2)}</strong></span>
                      <span>Paid: <strong className="text-green-600">${f.paid_amount.toFixed(2)}</strong></span>
                      <span>Balance: <strong className="text-red-600">${f.balance.toFixed(2)}</strong></span>
                    </div>
                    {f.due_date && <p className="mt-1 text-xs text-gray-400">Due: {new Date(f.due_date).toLocaleDateString()}</p>}
                    {f.is_carried_forward && <span className="mt-1 inline-block rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-700">Carried Forward</span>}
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    f.status === 'paid' ? 'bg-green-50 text-green-700' :
                    f.status === 'partial' ? 'bg-amber-50 text-amber-700' :
                    'bg-red-50 text-red-700'
                  }`}>
                    {f.status.charAt(0).toUpperCase() + f.status.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'payments' && (
        payments.length === 0 ? (
          <div className="rounded-xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-gray-100">
            <Wallet className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">No payments yet</h3>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Receipt</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Method</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-xs font-mono text-gray-600">{p.receipt_number || '—'}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">${p.amount.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className="inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                        {p.payment_method.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(p.payment_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${p.is_verified ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                        {p.is_verified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  )
}
