'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import { canAccess } from '@/lib/roles'
import api from '@/lib/api'
import Link from 'next/link'
import { CreditCard, Search, Loader2, ShieldAlert, CheckCircle } from 'lucide-react'

interface FeeAssign {
  id: number
  student_id: number
  fees_master_id: number
  total_amount: number
  paid_amount: number
  balance: number
  status: string
  due_date: string | null
  fees_type_name: string | null
  fees_group_name: string | null
}

export default function CollectFeesPage() {
  const { user } = useAuth()
  const [studentId, setStudentId] = useState('')
  const [dues, setDues] = useState<FeeAssign[]>([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)
  const [payingId, setPayingId] = useState<number | null>(null)
  const [paymentForm, setPaymentForm] = useState({ amount: '', payment_method: 'cash', note: '', transaction_id: '', bank_name: '', cheque_number: '' })
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  if (!canAccess(user?.role || '', 'fees:collect')) {
    return (
      <div className="rounded-xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-gray-100">
        <ShieldAlert className="mx-auto h-12 w-12 text-red-300" />
        <h3 className="mt-4 text-lg font-semibold text-gray-900">Access Denied</h3>
        <Link href="/dashboard" className="btn-primary mt-6 inline-flex">Back to Dashboard</Link>
      </div>
    )
  }

  async function searchStudent() {
    if (!studentId) return
    setSearching(true)
    setError('')
    setSuccess('')
    setSearched(true)
    try {
      const res = await api.get(`/fees/due/student/${studentId}`)
      setDues(res.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Student not found or no dues')
      setDues([])
    } finally { setSearching(false) }
  }

  async function handlePay(assignId: number) {
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }
    setError('')
    setSuccess('')
    try {
      await api.post('/fees/collect/', {
        school_id: user?.school_id || 1,
        student_id: parseInt(studentId),
        fees_assign_id: assignId,
        amount: parseFloat(paymentForm.amount),
        payment_method: paymentForm.payment_method,
        note: paymentForm.note || null,
        transaction_id: paymentForm.transaction_id || null,
        bank_name: paymentForm.bank_name || null,
        cheque_number: paymentForm.cheque_number || null,
      })
      setSuccess('Payment collected successfully!')
      setPayingId(null)
      setPaymentForm({ amount: '', payment_method: 'cash', note: '', transaction_id: '', bank_name: '', cheque_number: '' })
      // Refresh dues
      const res = await api.get(`/fees/due/student/${studentId}`)
      setDues(res.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to collect payment')
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Collect Fees</h1>
        <p className="mt-1 text-sm text-gray-500">Search for a student and collect their pending fees</p>
      </div>

      {success && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          <CheckCircle className="h-4 w-4" /> {success}
        </div>
      )}
      {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {/* Search bar */}
      <div className="mb-6 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="number"
            placeholder="Enter Student ID..."
            value={studentId}
            onChange={e => setStudentId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && searchStudent()}
            className="block w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <button onClick={searchStudent} disabled={searching} className="btn-primary gap-2">
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Search
        </button>
      </div>

      {/* Results */}
      {searched && dues.length === 0 && !searching && !error && (
        <div className="rounded-xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-gray-100">
          <CreditCard className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No pending fees</h3>
          <p className="mt-2 text-sm text-gray-500">This student has no outstanding fee balance.</p>
        </div>
      )}

      {dues.length > 0 && (
        <div className="space-y-4">
          {dues.map(d => (
            <div key={d.id} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{d.fees_group_name} - {d.fees_type_name}</h3>
                  <div className="mt-1 flex gap-4 text-xs text-gray-500">
                    <span>Total: <strong className="text-gray-700">${d.total_amount.toFixed(2)}</strong></span>
                    <span>Paid: <strong className="text-green-600">${d.paid_amount.toFixed(2)}</strong></span>
                    <span>Balance: <strong className="text-red-600">${d.balance.toFixed(2)}</strong></span>
                  </div>
                  {d.due_date && <p className="mt-1 text-xs text-gray-400">Due: {new Date(d.due_date).toLocaleDateString()}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    d.status === 'paid' ? 'bg-green-50 text-green-700' :
                    d.status === 'partial' ? 'bg-amber-50 text-amber-700' :
                    'bg-red-50 text-red-700'
                  }`}>
                    {d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                  </span>
                  {d.balance > 0 && (
                    <button onClick={() => { setPayingId(payingId === d.id ? null : d.id); setPaymentForm({ ...paymentForm, amount: String(d.balance) }) }}
                      className="btn-primary text-xs">
                      {payingId === d.id ? 'Cancel' : 'Pay'}
                    </button>
                  )}
                </div>
              </div>

              {payingId === d.id && (
                <div className="mt-4 border-t pt-4">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Amount *</label>
                      <input type="number" step="0.01" min="0.01" max={d.balance} value={paymentForm.amount}
                        onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Payment Method *</label>
                      <select value={paymentForm.payment_method} onChange={e => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                        <option value="cash">Cash</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="online">Online</option>
                        <option value="cheque">Cheque</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Transaction ID</label>
                      <input type="text" value={paymentForm.transaction_id}
                        onChange={e => setPaymentForm({ ...paymentForm, transaction_id: e.target.value })}
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-700">Note</label>
                    <input type="text" value={paymentForm.note}
                      onChange={e => setPaymentForm({ ...paymentForm, note: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Optional note" />
                  </div>
                  <button onClick={() => handlePay(d.id)} className="btn-primary mt-3 w-full gap-2">
                    <CreditCard className="h-4 w-4" /> Collect ${paymentForm.amount || '0.00'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
