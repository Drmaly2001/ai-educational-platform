'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { canAccess } from '@/lib/roles'
import api from '@/lib/api'
import Link from 'next/link'
import { Percent, Loader2, Plus, Pencil, Trash2, ShieldAlert } from 'lucide-react'

interface FeesDiscount {
  id: number
  name: string
  code: string
  discount_type: string
  amount: number
  description: string | null
  is_active: boolean
}

export default function FeesDiscountsPage() {
  const { user } = useAuth()
  const [discounts, setDiscounts] = useState<FeesDiscount[]>([])
  const [loading, setLoading] = useState(true)

  if (!canAccess(user?.role || '', 'fees:manage')) {
    return (
      <div className="rounded-xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-gray-100">
        <ShieldAlert className="mx-auto h-12 w-12 text-red-300" />
        <h3 className="mt-4 text-lg font-semibold text-gray-900">Access Denied</h3>
        <Link href="/dashboard" className="btn-primary mt-6 inline-flex">Back to Dashboard</Link>
      </div>
    )
  }

  useEffect(() => { fetchDiscounts() }, [])

  async function fetchDiscounts() {
    try {
      const res = await api.get('/fees/discounts/')
      setDiscounts(res.data)
    } catch { /* empty */ } finally { setLoading(false) }
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this discount?')) return
    try {
      await api.delete(`/fees/discounts/${id}`)
      setDiscounts(discounts.filter(d => d.id !== id))
    } catch { /* empty */ }
  }

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fees Discounts</h1>
          <p className="mt-1 text-sm text-gray-500">Manage fee discounts and waivers</p>
        </div>
        <Link href="/dashboard/fees/discounts/create" className="btn-primary gap-2">
          <Plus className="h-4 w-4" /> Add Discount
        </Link>
      </div>

      {discounts.length === 0 ? (
        <div className="rounded-xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-gray-100">
          <Percent className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No discounts yet</h3>
          <p className="mt-2 text-sm text-gray-500">Create your first discount to get started.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Code</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {discounts.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">{d.name}</p>
                    {d.description && <p className="text-xs text-gray-500">{d.description}</p>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{d.code}</td>
                  <td className="px-6 py-4">
                    <span className="inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                      {d.discount_type === 'percentage' ? 'Percentage' : 'Fixed'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {d.discount_type === 'percentage' ? `${d.amount}%` : `$${d.amount.toFixed(2)}`}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${d.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {d.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/dashboard/fees/discounts/${d.id}/edit`} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50">
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Link>
                      <button onClick={() => handleDelete(d.id)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
                        <Trash2 className="h-3.5 w-3.5" /> Delete
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
