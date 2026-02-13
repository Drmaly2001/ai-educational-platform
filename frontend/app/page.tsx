import Link from 'next/link'
import {
  BookOpen,
  Brain,
  BarChart3,
  ClipboardCheck,
  Target,
  Users,
  ArrowRight,
  GraduationCap,
} from 'lucide-react'

const features = [
  {
    icon: Brain,
    title: 'AI Tutoring',
    description: 'Real-time, personalized tutoring powered by Claude AI that adapts to each student\'s learning pace.',
  },
  {
    icon: BookOpen,
    title: 'Lesson Generation',
    description: 'Automatically generate syllabi, lesson plans, and learning materials aligned to your curriculum.',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Insights',
    description: 'Track student progress with comprehensive dashboards and actionable insights for teachers.',
  },
  {
    icon: ClipboardCheck,
    title: 'Smart Assessments',
    description: 'Auto-generate quizzes and exams with AI-powered grading and detailed feedback.',
  },
  {
    icon: Target,
    title: 'Curriculum Alignment',
    description: 'Map lessons to national and international standards with automatic alignment checks.',
  },
  {
    icon: Users,
    title: 'Multi-Role Support',
    description: 'Dedicated experiences for admins, teachers, students, and parents — all in one platform.',
  },
]

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="border-b border-gray-100">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <GraduationCap className="h-7 w-7 text-primary-600" />
            EduAI
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Features
            </a>
            <a href="#cta" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Pricing
            </a>
            <a href="#cta" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              About
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-secondary">
              Log in
            </Link>
            <Link href="/register" className="btn-primary">
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center lg:py-32">
        <div className="mx-auto max-w-3xl">
          <span className="mb-4 inline-block rounded-full bg-primary-50 px-4 py-1.5 text-sm font-medium text-primary-700">
            Powered by Anthropic Claude
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            The AI-Powered Platform for{' '}
            <span className="text-primary-600">Modern Education</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Generate syllabi, tutor students in real-time, track progress, and automate assessments
            — all with the intelligence of AI. Built for schools, teachers, and learners.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/register" className="btn-primary gap-2">
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#features" className="btn-secondary">
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-gray-50 px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to transform learning
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              A comprehensive toolkit designed for every stakeholder in education.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-100 transition-shadow hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-50">
                  <feature.icon className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-2xl bg-primary-600 px-8 py-16 text-center shadow-lg sm:px-16">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to get started?
          </h2>
          <p className="mt-4 text-lg text-primary-100">
            Join thousands of schools already using AI to elevate their teaching and learning.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-primary-600 shadow-sm transition-colors hover:bg-primary-50"
          >
            Create Your Free Account
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-6 py-12 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <GraduationCap className="h-5 w-5 text-primary-600" />
            EduAI
          </div>
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} AI Educational Platform. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-gray-500 hover:text-gray-700">Privacy</a>
            <a href="#" className="text-sm text-gray-500 hover:text-gray-700">Terms</a>
            <a href="#" className="text-sm text-gray-500 hover:text-gray-700">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
