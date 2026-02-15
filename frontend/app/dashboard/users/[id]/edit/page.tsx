'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Loader2, ShieldAlert, Save } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { canAccess, getRoleLabel } from '@/lib/roles'
import api from '@/lib/api'

const editUserSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  role: z.string().min(1, 'Please select a role'),
  is_active: z.boolean(),
})

type EditUserFormData = z.infer<typeof editUserSchema>

interface UserData {
  id: number
  email: string
  full_name: string
  role: string
  is_active: boolean
  is_verified: boolean
  school_id: number | null
  created_at: string
  last_login: string | null
}

const roleOptions = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'school_admin', label: 'School Admin' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'student', label: 'Student' },
  { value: 'parent', label: 'Parent' },
]

export default function EditUserPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string
  const { user } = useAuth()
  const [apiError, setApiError] = useState<string | null>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
  })

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await api.get(`/users/${userId}`)
        setUserData(response.data)
        reset({
          full_name: response.data.full_name,
          email: response.data.email,
          role: response.data.role,
          is_active: response.data.is_active,
        })
      } catch {
        setApiError('Failed to load user data.')
      } finally {
        setPageLoading(false)
      }
    }
    fetchUser()
  }, [userId, reset])

  if (!canAccess(user?.role || '', 'users:manage')) {
    return (
      <div className="rounded-xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-gray-100">
        <ShieldAlert className="mx-auto h-12 w-12 text-red-300" />
        <h3 className="mt-4 text-lg font-semibold text-gray-900">Access Denied</h3>
        <p className="mt-2 text-sm text-gray-500">You don&apos;t have permission to edit users.</p>
        <Link href="/dashboard" className="btn-primary mt-6 inline-flex">Back to Dashboard</Link>
      </div>
    )
  }

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="rounded-xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-gray-100">
        <h3 className="mt-4 text-lg font-semibold text-gray-900">User not found</h3>
        <Link href="/dashboard/users" className="btn-primary mt-6 inline-flex">Back to Users</Link>
      </div>
    )
  }

  async function onSubmit(data: EditUserFormData) {
    setApiError(null)
    setSuccessMessage(null)

    try {
      await api.put(`/users/${userId}`, data)
      setSuccessMessage('User updated successfully.')
      // Update local state
      setUserData((prev) => prev ? { ...prev, ...data } : prev)
    } catch (error: any) {
      const message =
        error.response?.data?.detail || 'Failed to update user. Please try again.'
      setApiError(typeof message === 'string' ? message : JSON.stringify(message))
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard/users"
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
        <p className="mt-1 text-sm text-gray-500">
          Editing {userData.full_name} ({userData.email})
        </p>
      </div>

      <div className="max-w-2xl rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
        {apiError && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {apiError}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Full Name */}
          <div>
            <label htmlFor="full_name" className="mb-1.5 block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              id="full_name"
              type="text"
              className={`block w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.full_name ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
              }`}
              {...register('full_name')}
            />
            {errors.full_name && <p className="mt-1 text-xs text-red-600">{errors.full_name.message}</p>}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              className={`block w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
              }`}
              {...register('email')}
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>

          {/* Role */}
          <div>
            <label htmlFor="role" className="mb-1.5 block text-sm font-medium text-gray-700">
              Role
            </label>
            <select
              id="role"
              className={`block w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.role ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
              }`}
              {...register('role')}
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.role && <p className="mt-1 text-xs text-red-600">{errors.role.message}</p>}
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-3">
            <input
              id="is_active"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              {...register('is_active')}
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
              Active account
            </label>
          </div>

          {/* User Info */}
          <div className="rounded-lg bg-gray-50 px-4 py-3">
            <h3 className="text-xs font-semibold uppercase text-gray-500 mb-2">Account Info</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p>Joined: {new Date(userData.created_at).toLocaleDateString()}</p>
              <p>Last login: {userData.last_login ? new Date(userData.last_login).toLocaleDateString() : 'Never'}</p>
              <p>Verified: {userData.is_verified ? 'Yes' : 'No'}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className="btn-primary gap-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
            <Link href="/dashboard/users" className="btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
