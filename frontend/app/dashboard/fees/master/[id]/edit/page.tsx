'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'

interface FeesType { id: number; name: string }
interface FeesGroup { id: number; name: string }

export default function EditFeesMasterPage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [feesTypes, setFeesTypes] = useState<FeesType[]>([])
  const [feesGroups, setFeesGroups] = useState<FeesGroup[]>([])
  const [form, setForm] = useState({
    fees_group_id: '',
    fees_type_id: '',
    amount: '',
    due_date: '',
    academic_year: '',
    term: '',
    is_active: true,
  })

  useEffect(() => {
    async function load() {
      try {
        const [masterRes, typesRes, groupsRes] = await Promise.all([
          api.get(`/fees/masters/${params.id}`),
          api.get('/fees/types/'),
          api.get('/fees/groups/'),
        ])
        const data = masterRes.data
        setFeesTypes(typesRes.data)
        setFeesGroups(groupsRes.data)
        setForm({
          fees_group_id: String(data.fees_group_id),
          fees_type_id: String(data.fees_type_id),
          amount: String(data.amount),
          due_date: data.due_date ? data.due_date.split('T')[0] : '',
          academic_year: data.academic_year || '',
          term: data.term || '',
          is_active: data.is_active,
        })
      } catch {
        setError('Failed to load fee master')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.put(`/fees/masters/${params.id}`, {
        fees_group_id: parseInt(form.fees_group_id),
        fees_type_id: parseInt(form.fees_type_id),
        amount: parseFloat(form.amount),
        due_date: form.due_date || null,
        academic_year: form.academic_year,
        term: form.term || null,
        is_active: form.is_active,
      })
      router.push('/dashboard/fees/master')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard/fees/master"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Fees Master
      </Link>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Edit Fee Master</h1>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        {/* Fee Group & Fee Type */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Fee Group *</label>
            <select
              required
              value={form.fees_group_id}
              onChange={(e) => setForm({ ...form, fees_group_id: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select group</option>
              {feesGroups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Fee Type *</label>
            <select
              required
              value={form.fees_type_id}
              onChange={(e) => setForm({ ...form, fees_type_id: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select type</option>
              {feesTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Amount & Due Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Amount *</label>
            <input
              type="number"
              required
              step="0.01"
              min="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Due Date</label>
            <input
              type="date"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Academic Year & Term */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Academic Year *</label>
            <select
              required
              value={form.academic_year}
              onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select year</option>
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - 1 + i
                const value = `${year}-${year + 1}`
                return (
                  <option key={value} value={value}>{value}</option>
                )
              })}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Term</label>
            <input
              type="text"
              value={form.term}
              onChange={(e) => setForm({ ...form, term: e.target.value })}
              placeholder="e.g., Term 1, Semester 1"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Active */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_active"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="is_active" className="text-sm text-gray-700">Active</label>
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save Changes
        </button>
      </form>
    </div>
  )
}
