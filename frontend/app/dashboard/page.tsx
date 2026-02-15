'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { getQuickActionsForRole, canAccess } from '@/lib/roles'
import api from '@/lib/api'
import {
  BookOpen,
  FileText,
  ClipboardList,
  Users,
  School,
  ArrowRight,
  Loader2,
  GraduationCap,
  Brain,
} from 'lucide-react'

interface DashboardStats {
  classes: number
  syllabi: number
  lessons: number
  users?: number
  schools?: number
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({ classes: 0, syllabi: 0, lessons: 0 })
  const [loading, setLoading] = useState(true)

  const role = user?.role || 'student'

  useEffect(() => {
    async function fetchStats() {
      try {
        const fetches: Promise<any>[] = [
          api.get('/classes/').catch(() => ({ data: [] })),
          api.get('/syllabi/').catch(() => ({ data: [] })),
          api.get('/lessons/').catch(() => ({ data: [] })),
        ]

        if (canAccess(role, 'users:manage')) {
          fetches.push(api.get('/users/').catch(() => ({ data: [] })))
        }
        if (canAccess(role, 'schools:manage')) {
          fetches.push(api.get('/schools/').catch(() => ({ data: [] })))
        }

        const results = await Promise.all(fetches)
        const newStats: DashboardStats = {
          classes: results[0].data.length,
          syllabi: results[1].data.length,
          lessons: results[2].data.length,
        }

        let idx = 3
        if (canAccess(role, 'users:manage')) {
          newStats.users = results[idx]?.data?.length || 0
          idx++
        }
        if (canAccess(role, 'schools:manage')) {
          newStats.schools = results[idx]?.data?.length || 0
        }

        setStats(newStats)
      } catch {
        // Stats will remain at 0
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [role])

  const quickActions = getQuickActionsForRole(role)

  // Build stat cards based on role
  const statCards = getStatCardsForRole(role, stats)

  // Role-specific welcome message
  const welcomeMessages: Record<string, string> = {
    super_admin: "Here's a platform-wide overview.",
    school_admin: "Here's an overview of your school.",
    teacher: "Here's an overview of your teaching workspace.",
    student: "Here's your learning overview.",
    parent: "Here's an overview of your child's progress.",
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.full_name?.split(' ')[0]}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {welcomeMessages[role] || "Here's your dashboard."}
        </p>
      </div>

      {/* Stats */}
      <div className={`mb-8 grid gap-4 ${statCards.length > 3 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3'}`}>
        {statCards.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition-shadow hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stat.value}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Quick Actions</h2>
        <div className={`grid gap-4 ${quickActions.length > 2 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex items-center gap-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition-shadow hover:shadow-md"
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${action.color}`}>
                <ArrowRight className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900">{action.label}</h3>
                <p className="text-xs text-gray-500">{action.description}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </Link>
          ))}
        </div>
      </div>

      {/* Role-specific banner */}
      {canAccess(role, 'ai:generate') && (
        <div className="rounded-xl bg-primary-600 p-8 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="h-6 w-6" />
            <h2 className="text-xl font-bold">AI-Powered Teaching</h2>
          </div>
          <p className="mt-2 text-primary-100">
            Create your classes, then use AI to generate complete syllabi and lesson plans automatically.
          </p>
          <div className="mt-4 flex gap-3">
            <Link
              href="/dashboard/classes/create"
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-primary-600 transition-colors hover:bg-primary-50"
            >
              Create a Class
            </Link>
            <Link
              href="/dashboard/syllabi/generate"
              className="rounded-lg border border-primary-400 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
            >
              Generate Syllabus
            </Link>
          </div>
        </div>
      )}

      {role === 'student' && (
        <div className="rounded-xl bg-green-600 p-8 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <GraduationCap className="h-6 w-6" />
            <h2 className="text-xl font-bold">Keep Learning!</h2>
          </div>
          <p className="mt-2 text-green-100">
            Continue with your lessons and track your progress. Your teachers are creating amazing content for you.
          </p>
          <div className="mt-4">
            <Link
              href="/dashboard/lessons"
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-green-600 transition-colors hover:bg-green-50"
            >
              Go to My Lessons
            </Link>
          </div>
        </div>
      )}

      {role === 'parent' && (
        <div className="rounded-xl bg-amber-600 p-8 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <GraduationCap className="h-6 w-6" />
            <h2 className="text-xl font-bold">Stay Informed</h2>
          </div>
          <p className="mt-2 text-amber-100">
            Monitor your child&apos;s learning progress and stay connected with their education journey.
          </p>
          <div className="mt-4">
            <Link
              href="/dashboard/progress"
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-amber-600 transition-colors hover:bg-amber-50"
            >
              View Progress
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

function getStatCardsForRole(role: string, stats: DashboardStats) {
  const cards = {
    classes: { label: 'Classes', value: stats.classes, icon: BookOpen, href: '/dashboard/classes', color: 'bg-blue-50 text-blue-600' },
    syllabi: { label: 'Syllabi', value: stats.syllabi, icon: FileText, href: '/dashboard/syllabi', color: 'bg-purple-50 text-purple-600' },
    lessons: { label: 'Lessons', value: stats.lessons, icon: ClipboardList, href: '/dashboard/lessons', color: 'bg-green-50 text-green-600' },
    users: { label: 'Users', value: stats.users || 0, icon: Users, href: '/dashboard/users', color: 'bg-orange-50 text-orange-600' },
    schools: { label: 'Schools', value: stats.schools || 0, icon: School, href: '/dashboard/schools', color: 'bg-red-50 text-red-600' },
  }

  switch (role) {
    case 'super_admin':
      return [cards.schools, cards.users, cards.classes, cards.lessons]
    case 'school_admin':
      return [cards.users, cards.classes, cards.syllabi, cards.lessons]
    case 'teacher':
      return [cards.classes, cards.syllabi, cards.lessons]
    case 'student':
      return [
        { ...cards.classes, label: 'My Classes' },
        { ...cards.lessons, label: 'My Lessons' },
      ]
    case 'parent':
      return [
        { ...cards.classes, label: "Child's Classes" },
      ]
    default:
      return [cards.classes, cards.lessons]
  }
}
