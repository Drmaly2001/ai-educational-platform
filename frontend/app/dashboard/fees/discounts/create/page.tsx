'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import api from '@/lib/api'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'

export default function CreateFeesDiscountPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', code: '', discount_type: 'percentage', amount: '', description: '' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post('/fees/discounts/', { ...form, amount: parseFloat(form.amount), school_id: user?.school_id || 1 })
      router.push('/dashboard/fees/discounts')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create discount')
    } finally { setLoading(false) }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/dashboard/fees/discounts" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Back to Discounts
      </Link>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Create Discount</h1>
      {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name *</label>
            <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., Sibling Discount" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Code *</label>
            <input type="text" required value={form.code} onChange={e => setForm({ ...form, code: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., SIB10" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Discount Type *</label>
            <select value={form.discount_type} onChange={e => setForm({ ...form, discount_type: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount ($)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Amount *</label>
            <input type="number" required step="0.01" min="0.01" max={form.discount_type === 'percentage' ? '100' : undefined}
              value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder={form.discount_type === 'percentage' ? 'e.g., 10' : 'e.g., 500'} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            rows={3} placeholder="Optional description" />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Create Discount
        </button>
      </form>
    </div>
  )
}
