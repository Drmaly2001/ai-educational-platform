'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { canAccess } from '@/lib/roles'
import api from '@/lib/api'
import Link from 'next/link'
import { Bell, Loader2, ShieldAlert, CheckCircle, Send } from 'lucide-react'

interface Reminder {
  id: number
  student_id: number
  reminder_type: string
  message: string | null
  sent_at: string
}

export default function RemindersPage() {
  const { user } = useAuth()
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState({ student_ids: '', reminder_type: 'in_app', message: '' })

  if (!canAccess(user?.role || '', 'fees:manage')) {
    return (
      <div className="rounded-xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-gray-100">
        <ShieldAlert className="mx-auto h-12 w-12 text-red-300" />
        <h3 className="mt-4 text-lg font-semibold text-gray-900">Access Denied</h3>
        <Link href="/dashboard" className="btn-primary mt-6 inline-flex">Back to Dashboard</Link>
      </div>
    )
  }

  useEffect(() => { fetchReminders() }, [])

  async function fetchReminders() {
    try {
      const res = await api.get('/fees/reminders/')
      setReminders(res.data)
    } catch { /* empty */ } finally { setLoading(false) }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!form.student_ids) {
      setError('Please enter student IDs')
      return
    }
    setSending(true)
    setError('')
    setSuccess('')
    try {
      const res = await api.post('/fees/reminders/', {
        school_id: user?.school_id || 1,
        student_ids: form.student_ids.split(',').map(s => parseInt(s.trim())),
        reminder_type: form.reminder_type,
        message: form.message || null,
      })
      setSuccess(`Sent ${res.data.sent_count} reminder(s) successfully!`)
      setForm({ student_ids: '', reminder_type: 'in_app', message: '' })
      fetchReminders()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send reminders')
    } finally { setSending(false) }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Fees Reminders</h1>
        <p className="mt-1 text-sm text-gray-500">Send payment reminders to students with pending fees</p>
      </div>

      {success && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          <CheckCircle className="h-4 w-4" /> {success}
        </div>
      )}
      {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {/* Send form */}
      <form onSubmit={handleSend} className="mb-8 space-y-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">Send New Reminder</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Student IDs *</label>
            <input type="text" value={form.student_ids} onChange={e => setForm({ ...form, student_ids: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Comma-separated: 1, 2, 3" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Reminder Type *</label>
            <select value={form.reminder_type} onChange={e => setForm({ ...form, reminder_type: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="in_app">In-App</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Custom Message</label>
          <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            rows={3} placeholder="Optional custom message. Default message will be used if empty." />
        </div>
        <button type="submit" disabled={sending} className="btn-primary gap-2">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Send Reminders
        </button>
      </form>

      {/* Reminder history */}
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Reminder History</h2>
      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>
      ) : reminders.length === 0 ? (
        <div className="rounded-xl bg-white px-6 py-12 text-center shadow-sm ring-1 ring-gray-100">
          <Bell className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No reminders sent yet</h3>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Student ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Message</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Sent At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reminders.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">#{r.student_id}</td>
                  <td className="px-6 py-4">
                    <span className="inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                      {r.reminder_type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{r.message || 'Default reminder'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(r.sent_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
