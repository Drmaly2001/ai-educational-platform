'use client'

import { useAuth } from '@/lib/auth'
import { canAccess } from '@/lib/roles'
import Link from 'next/link'
import {
  DollarSign, CreditCard, Search, Clock, Settings, Zap,
  FolderOpen, Tag, Percent, ArrowRightLeft, Bell, Building,
  ShieldAlert
} from 'lucide-react'

const adminCards = [
  { name: 'Collect Fees', href: '/dashboard/fees/collect', icon: CreditCard, description: 'Collect fee payments from students', color: 'bg-green-50 text-green-700' },
  { name: 'Search Payments', href: '/dashboard/fees/search-payments', icon: Search, description: 'Search and view payment records', color: 'bg-blue-50 text-blue-700' },
  { name: 'Search Due Fees', href: '/dashboard/fees/search-due', icon: Clock, description: 'Find students with pending fees', color: 'bg-red-50 text-red-700' },
  { name: 'Fees Master', href: '/dashboard/fees/master', icon: Settings, description: 'Configure fee structures', color: 'bg-purple-50 text-purple-700' },
  { name: 'Quick Fees', href: '/dashboard/fees/quick', icon: Zap, description: 'Bulk assign fees to students', color: 'bg-amber-50 text-amber-700' },
  { name: 'Fees Group', href: '/dashboard/fees/groups', icon: FolderOpen, description: 'Manage fee groups', color: 'bg-indigo-50 text-indigo-700' },
  { name: 'Fees Type', href: '/dashboard/fees/types', icon: Tag, description: 'Manage fee types', color: 'bg-teal-50 text-teal-700' },
  { name: 'Fees Discount', href: '/dashboard/fees/discounts', icon: Percent, description: 'Manage discounts', color: 'bg-pink-50 text-pink-700' },
  { name: 'Offline Bank Payments', href: '/dashboard/fees/offline-bank', icon: Building, description: 'Verify offline bank payments', color: 'bg-orange-50 text-orange-700' },
  { name: 'Fees Carry Forward', href: '/dashboard/fees/carry-forward', icon: ArrowRightLeft, description: 'Carry forward unpaid fees', color: 'bg-cyan-50 text-cyan-700' },
  { name: 'Fees Reminder', href: '/dashboard/fees/reminders', icon: Bell, description: 'Send payment reminders', color: 'bg-rose-50 text-rose-700' },
]

export default function FeesPage() {
  const { user } = useAuth()

  if (!canAccess(user?.role || '', 'fees:manage')) {
    return (
      <div className="rounded-xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-gray-100">
        <ShieldAlert className="mx-auto h-12 w-12 text-red-300" />
        <h3 className="mt-4 text-lg font-semibold text-gray-900">Access Denied</h3>
        <p className="mt-2 text-sm text-gray-500">You don&apos;t have permission to manage fees.</p>
        <Link href="/dashboard" className="btn-primary mt-6 inline-flex">Back to Dashboard</Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Fees Collection</h1>
        <p className="mt-1 text-sm text-gray-500">Manage all aspects of school fee collection</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {adminCards.map((card) => (
          <Link
            key={card.name}
            href={card.href}
            className="group rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100 transition-all hover:shadow-md hover:ring-gray-200"
          >
            <div className="flex items-start gap-4">
              <div className={`rounded-lg p-2.5 ${card.color}`}>
                <card.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 group-hover:text-primary-600">{card.name}</h3>
                <p className="mt-1 text-xs text-gray-500">{card.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
