'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { canAccess } from '@/lib/roles'
import api from '@/lib/api'
import Link from 'next/link'
import { FolderOpen, Loader2, Plus, Pencil, Trash2, ShieldAlert } from 'lucide-react'

interface FeesGroup {
  id: number
  name: string
  description: string | null
  is_active: boolean
  created_at: string
}

export default function FeesGroupsPage() {
  const { user } = useAuth()
  const [groups, setGroups] = useState<FeesGroup[]>([])
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

  useEffect(() => { fetchGroups() }, [])

  async function fetchGroups() {
    try {
      const res = await api.get('/fees/groups/')
      setGroups(res.data)
    } catch { /* empty */ } finally { setLoading(false) }
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this fee group?')) return
    try {
      await api.delete(`/fees/groups/${id}`)
      setGroups(groups.filter(g => g.id !== id))
    } catch { /* empty */ }
  }

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fees Groups</h1>
          <p className="mt-1 text-sm text-gray-500">Organize fees into groups</p>
        </div>
        <Link href="/dashboard/fees/groups/create" className="btn-primary gap-2">
          <Plus className="h-4 w-4" /> Add Group
        </Link>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-gray-100">
          <FolderOpen className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No fee groups yet</h3>
          <p className="mt-2 text-sm text-gray-500">Create your first fee group to get started.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {groups.map((g) => (
                <tr key={g.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">{g.name}</p>
                    {g.description && <p className="text-xs text-gray-500">{g.description}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${g.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {g.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/dashboard/fees/groups/${g.id}/edit`} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50">
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Link>
                      <button onClick={() => handleDelete(g.id)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
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
