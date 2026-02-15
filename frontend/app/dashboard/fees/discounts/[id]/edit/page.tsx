'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'

export default function EditFeesDiscountPage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', code: '', discount_type: 'percentage', amount: '', description: '', is_active: true })

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get(`/fees/discounts/${params.id}`)
        setForm({
          name: res.data.name, code: res.data.code, discount_type: res.data.discount_type,
          amount: String(res.data.amount), description: res.data.description || '', is_active: res.data.is_active
        })
      } catch { setError('Failed to load') } finally { setLoading(false) }
    }
    load()
  }, [params.id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.put(`/fees/discounts/${params.id}`, { ...form, amount: parseFloat(form.amount) })
      router.push('/dashboard/fees/discounts')
    } catch (err: any) { setError(err.response?.data?.detail || 'Failed to update') } finally { setSaving(false) }
  }

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/dashboard/fees/discounts" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Back to Discounts
      </Link>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Edit Discount</h1>
      {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name *</label>
            <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Code *</label>
            <input type="text" required value={form.code} onChange={e => setForm({ ...form, code: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
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
            <input type="number" required step="0.01" min="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500" rows={3} />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
          <label htmlFor="is_active" className="text-sm text-gray-700">Active</label>
        </div>
        <button type="submit" disabled={saving} className="btn-primary w-full gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save Changes
        </button>
      </form>
    </div>
  )
}
