'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { canAccess } from '@/lib/roles'
import api from '@/lib/api'
import Link from 'next/link'
import { Settings, Loader2, Plus, Pencil, Trash2, ShieldAlert } from 'lucide-react'

interface FeesMaster {
  id: number
  fees_group_id: number
  fees_type_id: number
  amount: number
  due_date: string | null
  academic_year: string
  term: string | null
  is_active: boolean
  fees_type_name: string | null
  fees_group_name: string | null
}

export default function FeesMasterPage() {
  const { user } = useAuth()
  const [masters, setMasters] = useState<FeesMaster[]>([])
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

  useEffect(() => { fetchMasters() }, [])

  async function fetchMasters() {
    try {
      const res = await api.get('/fees/masters/')
      setMasters(res.data)
    } catch { /* empty */ } finally { setLoading(false) }
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this fee master entry?')) return
    try {
      await api.delete(`/fees/masters/${id}`)
      setMasters(masters.filter(m => m.id !== id))
    } catch { /* empty */ }
  }

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fees Master</h1>
          <p className="mt-1 text-sm text-gray-500">Configure fee structures by linking groups and types</p>
        </div>
        <Link href="/dashboard/fees/master/create" className="btn-primary gap-2">
          <Plus className="h-4 w-4" /> Add Fee Master
        </Link>
      </div>

      {masters.length === 0 ? (
        <div className="rounded-xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-gray-100">
          <Settings className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No fee master entries yet</h3>
          <p className="mt-2 text-sm text-gray-500">Create fee types and groups first, then configure fee master entries.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Group</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Academic Year</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {masters.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{m.fees_group_name || `Group #${m.fees_group_id}`}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{m.fees_type_name || `Type #${m.fees_type_id}`}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">${m.amount.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{m.academic_year}{m.term && ` - ${m.term}`}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{m.due_date ? new Date(m.due_date).toLocaleDateString() : '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${m.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {m.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/dashboard/fees/master/${m.id}/edit`} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50">
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Link>
                      <button onClick={() => handleDelete(m.id)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
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
