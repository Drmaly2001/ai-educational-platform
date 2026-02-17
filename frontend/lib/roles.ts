import {
  LayoutDashboard,
  BookOpen,
  FileText,
  ClipboardList,
  Users,
  School,
  BarChart3,
  GraduationCap,
  DollarSign,
  Wallet,
  UserCheck,
  type LucideIcon,
} from 'lucide-react'

export type UserRole = 'super_admin' | 'school_admin' | 'teacher' | 'student' | 'parent'

export interface NavItem {
  name: string
  href: string
  icon: LucideIcon
}

export interface QuickAction {
  label: string
  href: string
  description: string
  color: string
}

const allNavItems: Record<string, NavItem> = {
  dashboard: { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  subjects: { name: 'Subjects', href: '/dashboard/subjects', icon: GraduationCap },
  classes: { name: 'Classes', href: '/dashboard/classes', icon: BookOpen },
  syllabi: { name: 'Syllabi', href: '/dashboard/syllabi', icon: FileText },
  lessons: { name: 'Lessons', href: '/dashboard/lessons', icon: ClipboardList },
  users: { name: 'Users', href: '/dashboard/users', icon: Users },
  schools: { name: 'Schools', href: '/dashboard/schools', icon: School },
  fees: { name: 'Fees', href: '/dashboard/fees', icon: DollarSign },
  myFees: { name: 'My Fees', href: '/dashboard/fees/my-fees', icon: Wallet },
  analytics: { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  progress: { name: 'Progress', href: '/dashboard/progress', icon: GraduationCap },
  students: { name: 'Students', href: '/dashboard/students', icon: UserCheck },
}

const navigationByRole: Record<UserRole, NavItem[]> = {
  super_admin: [
    allNavItems.dashboard,
    allNavItems.schools,
    allNavItems.users,
    allNavItems.subjects,
    allNavItems.classes,
    allNavItems.students,
    allNavItems.syllabi,
    allNavItems.lessons,
    allNavItems.fees,
  ],
  school_admin: [
    allNavItems.dashboard,
    allNavItems.users,
    allNavItems.subjects,
    allNavItems.classes,
    allNavItems.students,
    allNavItems.syllabi,
    allNavItems.lessons,
    allNavItems.fees,
  ],
  teacher: [
    allNavItems.dashboard,
    allNavItems.classes,
    allNavItems.students,
    allNavItems.syllabi,
    allNavItems.lessons,
  ],
  student: [
    allNavItems.dashboard,
    allNavItems.classes,
    allNavItems.lessons,
    allNavItems.progress,
    allNavItems.myFees,
  ],
  parent: [
    allNavItems.dashboard,
    allNavItems.classes,
    allNavItems.progress,
    allNavItems.myFees,
  ],
}

const quickActionsByRole: Record<UserRole, QuickAction[]> = {
  super_admin: [
    { label: 'Manage Schools', href: '/dashboard/schools', description: 'Add or manage schools', color: 'bg-purple-50 text-purple-700' },
    { label: 'Manage Users', href: '/dashboard/users', description: 'Add or manage users', color: 'bg-blue-50 text-blue-700' },
    { label: 'View Analytics', href: '/dashboard/analytics', description: 'Platform-wide analytics', color: 'bg-green-50 text-green-700' },
  ],
  school_admin: [
    { label: 'Manage Users', href: '/dashboard/users', description: 'Teachers & students', color: 'bg-blue-50 text-blue-700' },
    { label: 'View Classes', href: '/dashboard/classes', description: 'All school classes', color: 'bg-indigo-50 text-indigo-700' },
    { label: 'View Analytics', href: '/dashboard/analytics', description: 'School analytics', color: 'bg-green-50 text-green-700' },
  ],
  teacher: [
    { label: 'Create Class', href: '/dashboard/classes/create', description: 'Set up a new class', color: 'bg-blue-50 text-blue-700' },
    { label: 'Manage Students', href: '/dashboard/students', description: 'View & enroll students', color: 'bg-teal-50 text-teal-700' },
    { label: 'Generate Syllabus', href: '/dashboard/syllabi/generate', description: 'AI-powered syllabus', color: 'bg-purple-50 text-purple-700' },
  ],
  student: [
    { label: 'My Lessons', href: '/dashboard/lessons', description: 'Continue learning', color: 'bg-blue-50 text-blue-700' },
    { label: 'My Progress', href: '/dashboard/progress', description: 'Track your progress', color: 'bg-green-50 text-green-700' },
  ],
  parent: [
    { label: "Child's Progress", href: '/dashboard/progress', description: 'View progress reports', color: 'bg-green-50 text-green-700' },
    { label: "Child's Classes", href: '/dashboard/classes', description: 'View enrolled classes', color: 'bg-blue-50 text-blue-700' },
  ],
}

// Permission definitions: which roles can access each feature
const featurePermissions: Record<string, UserRole[]> = {
  'classes:create': ['super_admin', 'school_admin', 'teacher'],
  'classes:edit': ['super_admin', 'school_admin', 'teacher'],
  'syllabi:generate': ['super_admin', 'school_admin', 'teacher'],
  'syllabi:edit': ['super_admin', 'school_admin', 'teacher'],
  'lessons:create': ['super_admin', 'school_admin', 'teacher'],
  'lessons:edit': ['super_admin', 'school_admin', 'teacher'],
  'users:manage': ['super_admin', 'school_admin'],
  'schools:manage': ['super_admin'],
  'subjects:manage': ['super_admin', 'school_admin'],
  'subjects:view': ['super_admin', 'school_admin', 'teacher'],
  'fees:manage': ['super_admin', 'school_admin'],
  'fees:collect': ['super_admin', 'school_admin'],
  'fees:view': ['super_admin', 'school_admin', 'student', 'parent'],
  'ai:generate': ['super_admin', 'school_admin', 'teacher'],
  'analytics:view': ['super_admin', 'school_admin', 'teacher'],
  'students:view': ['super_admin', 'school_admin', 'teacher'],
  'students:create': ['super_admin', 'school_admin', 'teacher'],
  'students:edit': ['super_admin', 'school_admin', 'teacher'],
}

export function getNavigationForRole(role: string): NavItem[] {
  return navigationByRole[role as UserRole] || navigationByRole.student
}

export function getQuickActionsForRole(role: string): QuickAction[] {
  return quickActionsByRole[role as UserRole] || quickActionsByRole.student
}

export function canAccess(role: string, feature: string): boolean {
  const allowed = featurePermissions[feature]
  if (!allowed) return false
  return allowed.includes(role as UserRole)
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    super_admin: 'Super Admin',
    school_admin: 'School Admin',
    teacher: 'Teacher',
    student: 'Student',
    parent: 'Parent',
  }
  return labels[role] || role
}

export function getRoleBadgeColor(role: string): string {
  const colors: Record<string, string> = {
    super_admin: 'bg-red-100 text-red-700',
    school_admin: 'bg-purple-100 text-purple-700',
    teacher: 'bg-blue-100 text-blue-700',
    student: 'bg-green-100 text-green-700',
    parent: 'bg-amber-100 text-amber-700',
  }
  return colors[role] || 'bg-gray-100 text-gray-700'
}
