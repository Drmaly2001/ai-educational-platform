'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Brain, Loader2, Sparkles, X, ShieldAlert, Lightbulb, Plus } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { canAccess } from '@/lib/roles'
import api from '@/lib/api'

interface ClassSubjectItem {
  id: number
  subject_id: number
  subject: {
    id: number
    name: string
    code: string
  } | null
}

interface ClassItem {
  id: number
  name: string
  grade_level: string
  academic_year: string
  class_subjects: ClassSubjectItem[]
}

// ---- Suggested objectives & instructions per subject ----

const subjectObjectives: Record<string, string[]> = {
  Mathematics: [
    'Develop problem-solving and critical thinking skills',
    'Master fundamental arithmetic and algebraic operations',
    'Understand geometric concepts and spatial reasoning',
    'Apply mathematical concepts to real-world situations',
    'Develop data analysis and statistical reasoning',
    'Build proficiency in mathematical proofs and logical reasoning',
    'Strengthen mental math and estimation skills',
  ],
  Physics: [
    'Understand fundamental laws of motion and forces',
    'Apply scientific method to conduct experiments',
    'Analyze energy transformations and conservation laws',
    'Understand wave phenomena and electromagnetic spectrum',
    'Develop skills in scientific measurement and data analysis',
    'Connect physics concepts to everyday technology',
  ],
  Chemistry: [
    'Understand atomic structure and the periodic table',
    'Master chemical bonding and molecular interactions',
    'Balance chemical equations and understand stoichiometry',
    'Conduct safe laboratory experiments and record observations',
    'Understand acids, bases, and chemical reactions',
    'Explore organic chemistry fundamentals',
  ],
  Biology: [
    'Understand cell structure and function',
    'Explain processes of genetics and heredity',
    'Understand ecosystems and environmental interactions',
    'Describe human body systems and their functions',
    'Apply scientific inquiry to biological investigations',
    'Understand evolution and biodiversity',
  ],
  English: [
    'Develop reading comprehension and analytical skills',
    'Improve academic and creative writing abilities',
    'Expand vocabulary and language usage',
    'Analyze literary texts and identify literary devices',
    'Develop effective oral communication and presentation skills',
    'Master grammar, punctuation, and sentence structure',
  ],
  Arabic: [
    'تطوير مهارات القراءة والفهم',
    'تحسين مهارات الكتابة الإبداعية والأكاديمية',
    'توسيع المفردات واستخدام اللغة',
    'تحليل النصوص الأدبية والشعرية',
    'تطوير مهارات التواصل الشفهي',
    'إتقان قواعد النحو والصرف',
  ],
  Science: [
    'Apply the scientific method to investigations',
    'Understand basic concepts in physics, chemistry, and biology',
    'Develop observation and data collection skills',
    'Analyze experimental results and draw conclusions',
    'Connect scientific concepts to everyday life',
    'Understand environmental science and sustainability',
  ],
  History: [
    'Analyze historical events and their causes and effects',
    'Develop skills in evaluating primary and secondary sources',
    'Understand the development of civilizations and cultures',
    'Connect historical events to contemporary issues',
    'Develop critical thinking about historical narratives',
    'Understand political, economic, and social change over time',
  ],
  Geography: [
    'Understand physical and human geography concepts',
    'Develop map reading and spatial analysis skills',
    'Analyze environmental issues and sustainability',
    'Understand population dynamics and urbanization',
    'Study climate patterns and natural disasters',
    'Explore economic geography and global trade',
  ],
  'Computer Science': [
    'Develop computational thinking and problem-solving skills',
    'Learn fundamental programming concepts and algorithms',
    'Understand data structures and their applications',
    'Apply software development best practices',
    'Understand computer networks and cybersecurity basics',
    'Develop skills in web development or app creation',
  ],
  Art: [
    'Develop artistic techniques across different mediums',
    'Understand elements and principles of design',
    'Analyze and appreciate art from various cultures and periods',
    'Express ideas creatively through visual arts',
    'Develop critical evaluation skills for artwork',
    'Explore digital art and modern creative tools',
  ],
  Music: [
    'Develop music reading and notation skills',
    'Understand rhythm, melody, and harmony',
    'Perform individually and in ensemble settings',
    'Analyze music from different genres and cultures',
    'Develop ear training and aural skills',
    'Compose and arrange simple musical pieces',
  ],
  'Physical Education': [
    'Develop physical fitness and motor skills',
    'Understand rules and strategies of various sports',
    'Promote teamwork and sportsmanship',
    'Develop healthy lifestyle habits',
    'Understand body mechanics and injury prevention',
    'Build confidence through physical activity',
  ],
  Economics: [
    'Understand basic economic principles and concepts',
    'Analyze supply, demand, and market dynamics',
    'Understand fiscal and monetary policy',
    'Evaluate economic decision-making processes',
    'Understand international trade and globalization',
    'Apply economic reasoning to real-world situations',
  ],
}

const subjectInstructions: Record<string, string> = {
  Mathematics: 'Include problem-solving exercises for each topic. Use real-world applications and visual representations. Incorporate both individual practice and collaborative problem-solving activities.',
  Physics: 'Include hands-on experiments and demonstrations. Connect theoretical concepts to real-world applications and technology. Include mathematical problem-solving alongside conceptual understanding.',
  Chemistry: 'Include safe laboratory experiments for each major topic. Balance theoretical knowledge with practical applications. Use molecular models and visual aids.',
  Biology: 'Include laboratory investigations and field studies where possible. Use diagrams and models to explain complex processes. Connect topics to health, medicine, and environmental awareness.',
  English: 'Include a variety of reading materials (fiction, non-fiction, poetry). Balance grammar instruction with creative and analytical writing. Incorporate speaking and listening activities.',
  Arabic: 'تضمين نصوص متنوعة من الأدب العربي القديم والحديث. الموازنة بين القواعد النحوية والتعبير الإبداعي. تضمين أنشطة الاستماع والتحدث والكتابة.',
  Science: 'Include hands-on experiments and scientific investigations. Use the inquiry-based learning approach. Connect science to everyday life and current events.',
  History: 'Use primary sources and historical documents. Include discussions and debates on historical interpretations. Connect historical events to current world affairs.',
  Geography: 'Include map work and GIS activities. Use case studies from different regions. Incorporate fieldwork and data collection where possible.',
  'Computer Science': 'Include hands-on coding projects and exercises. Use pair programming and collaborative development. Build progressively complex projects throughout the course.',
  Art: 'Include hands-on studio projects for each unit. Expose students to diverse artistic traditions and contemporary art. Balance technique development with creative expression.',
  Music: 'Include regular performance opportunities. Balance music theory with practical music-making. Expose students to diverse musical genres and traditions.',
  'Physical Education': 'Include a variety of individual and team sports. Focus on skill development and fitness improvement. Ensure inclusive activities for all ability levels.',
  Economics: 'Use real-world case studies and current events. Include simulations and role-playing activities. Connect economic theory to personal financial literacy.',
}

// Fuzzy match subject name to suggestions
function getSubjectKey(subjectName: string): string | null {
  const lower = subjectName.toLowerCase()
  for (const key of Object.keys(subjectObjectives)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return key
    }
  }
  // Common aliases
  if (lower.includes('math')) return 'Mathematics'
  if (lower.includes('رياضيات')) return 'Mathematics'
  if (lower.includes('فيزياء')) return 'Physics'
  if (lower.includes('كيمياء')) return 'Chemistry'
  if (lower.includes('أحياء') || lower.includes('احياء')) return 'Biology'
  if (lower.includes('عربي') || lower.includes('لغة عربية')) return 'Arabic'
  if (lower.includes('إنجليزي') || lower.includes('انجليزي') || lower.includes('لغة إنجليزية')) return 'English'
  if (lower.includes('تاريخ')) return 'History'
  if (lower.includes('جغرافيا')) return 'Geography'
  if (lower.includes('حاسوب') || lower.includes('حاسب') || lower.includes('برمجة')) return 'Computer Science'
  if (lower.includes('تربية بدنية') || lower.includes('رياضة')) return 'Physical Education'
  if (lower.includes('موسيقى')) return 'Music'
  if (lower.includes('فنون') || lower.includes('رسم') || lower.includes('تشكيل')) return 'Art'
  if (lower.includes('اقتصاد')) return 'Economics'
  if (lower.includes('علوم')) return 'Science'
  return null
}

const generateSchema = z.object({
  class_id: z.string().min(1, 'Class is required'),
  subject: z.string().min(1, 'Subject is required'),
  curriculum_standard: z.string().min(1, 'Curriculum standard is required'),
  duration_weeks: z.coerce.number().min(1).max(52, 'Duration must be 1-52 weeks'),
  additional_instructions: z.string().optional(),
})

type GenerateFormData = z.infer<typeof generateSchema>

export default function GenerateSyllabusPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [apiError, setApiError] = useState<string | null>(null)
  const [objectives, setObjectives] = useState<string[]>([])
  const [objectiveInput, setObjectiveInput] = useState('')
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [loadingClasses, setLoadingClasses] = useState(true)
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null)
  const [suggestedObjectives, setSuggestedObjectives] = useState<string[]>([])
  const [suggestedInstruction, setSuggestedInstruction] = useState<string>('')

  if (!canAccess(user?.role || '', 'syllabi:generate')) {
    return (
      <div className="rounded-xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-gray-100">
        <ShieldAlert className="mx-auto h-12 w-12 text-red-300" />
        <h3 className="mt-4 text-lg font-semibold text-gray-900">Access Denied</h3>
        <p className="mt-2 text-sm text-gray-500">You don&apos;t have permission to generate syllabi.</p>
        <Link href="/dashboard" className="btn-primary mt-6 inline-flex">Back to Dashboard</Link>
      </div>
    )
  }

  useEffect(() => {
    async function fetchClasses() {
      try {
        const res = await api.get('/classes/')
        setClasses(res.data)
      } catch {
        // ignore
      } finally {
        setLoadingClasses(false)
      }
    }
    fetchClasses()
  }, [])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<GenerateFormData>({
    resolver: zodResolver(generateSchema),
    defaultValues: {
      duration_weeks: 12,
      class_id: '',
      subject: '',
    },
  })

  const watchClassId = watch('class_id')
  const watchSubject = watch('subject')

  useEffect(() => {
    if (watchClassId) {
      const cls = classes.find((c) => String(c.id) === watchClassId)
      setSelectedClass(cls || null)
      setValue('subject', '')
      setSuggestedObjectives([])
      setSuggestedInstruction('')
    } else {
      setSelectedClass(null)
      setValue('subject', '')
      setSuggestedObjectives([])
      setSuggestedInstruction('')
    }
  }, [watchClassId, classes, setValue])

  // Update suggestions when subject changes
  useEffect(() => {
    if (watchSubject) {
      const key = getSubjectKey(watchSubject)
      if (key) {
        setSuggestedObjectives(subjectObjectives[key] || [])
        setSuggestedInstruction(subjectInstructions[key] || '')
      } else {
        setSuggestedObjectives([])
        setSuggestedInstruction('')
      }
    } else {
      setSuggestedObjectives([])
      setSuggestedInstruction('')
    }
  }, [watchSubject])

  function addObjective() {
    const trimmed = objectiveInput.trim()
    if (trimmed && !objectives.includes(trimmed)) {
      setObjectives([...objectives, trimmed])
      setObjectiveInput('')
    }
  }

  function addSuggestedObjective(obj: string) {
    if (!objectives.includes(obj)) {
      setObjectives([...objectives, obj])
    }
  }

  function addAllSuggestions() {
    const newObjectives = [...objectives]
    for (const obj of suggestedObjectives) {
      if (!newObjectives.includes(obj)) {
        newObjectives.push(obj)
      }
    }
    setObjectives(newObjectives)
  }

  function removeObjective(index: number) {
    setObjectives(objectives.filter((_, i) => i !== index))
  }

  function applySuggestedInstruction() {
    setValue('additional_instructions', suggestedInstruction)
  }

  async function onSubmit(data: GenerateFormData) {
    setApiError(null)

    try {
      const cls = classes.find((c) => String(c.id) === data.class_id)
      const response = await api.post('/ai/generate-syllabus', {
        subject: data.subject,
        grade_level: cls?.grade_level || '',
        curriculum_standard: data.curriculum_standard,
        duration_weeks: data.duration_weeks,
        school_id: user?.school_id || 1,
        learning_objectives: objectives.length > 0 ? objectives : undefined,
        additional_instructions: data.additional_instructions,
        class_id: parseInt(data.class_id),
      })

      router.push(`/dashboard/syllabi/${response.data.id}`)
    } catch (error: any) {
      const message =
        error.response?.data?.detail || 'Failed to generate syllabus. Please try again.'
      setApiError(typeof message === 'string' ? message : JSON.stringify(message))
    }
  }

  const availableSubjects = selectedClass?.class_subjects?.filter((cs) => cs.subject) || []
  const remainingSuggestions = suggestedObjectives.filter((s) => !objectives.includes(s))

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard/syllabi"
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Syllabi
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
            <Brain className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Generate Syllabus with AI</h1>
            <p className="text-sm text-gray-500">Select a class and subject, then let AI create a comprehensive syllabus</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
        {apiError && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Class & Subject */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="class_id" className="mb-1.5 block text-sm font-medium text-gray-700">
                Class *
              </label>
              {loadingClasses ? (
                <div className="flex items-center gap-2 py-2.5 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading classes...
                </div>
              ) : (
                <select
                  id="class_id"
                  className={`block w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.class_id ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  {...register('class_id')}
                >
                  <option value="">Select a class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} — {cls.grade_level} ({cls.academic_year})
                    </option>
                  ))}
                </select>
              )}
              {errors.class_id && <p className="mt-1 text-xs text-red-600">{errors.class_id.message}</p>}
            </div>

            <div>
              <label htmlFor="subject" className="mb-1.5 block text-sm font-medium text-gray-700">
                Subject *
              </label>
              <select
                id="subject"
                disabled={!selectedClass}
                className={`block w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:bg-gray-50 ${
                  errors.subject ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                }`}
                {...register('subject')}
              >
                <option value="">
                  {!selectedClass
                    ? 'Select a class first'
                    : availableSubjects.length === 0
                    ? 'No subjects assigned to this class'
                    : 'Select a subject'}
                </option>
                {availableSubjects.map((cs) => (
                  <option key={cs.subject_id} value={cs.subject!.name}>
                    {cs.subject!.name} ({cs.subject!.code})
                  </option>
                ))}
              </select>
              {errors.subject && <p className="mt-1 text-xs text-red-600">{errors.subject.message}</p>}
              {selectedClass && availableSubjects.length === 0 && (
                <p className="mt-1 text-xs text-amber-600">
                  <Link href={`/dashboard/classes/${selectedClass.id}/subjects`} className="underline">
                    Assign subjects to this class first
                  </Link>
                </p>
              )}
            </div>
          </div>

          {/* Grade Level (read-only, auto-filled) */}
          {selectedClass && (
            <div className="rounded-lg bg-gray-50 px-4 py-3">
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-700">Grade Level:</span> {selectedClass.grade_level}
                <span className="mx-3 text-gray-300">|</span>
                <span className="font-medium text-gray-700">Academic Year:</span> {selectedClass.academic_year}
              </p>
            </div>
          )}

          {/* Curriculum Standard & Duration */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="curriculum_standard" className="mb-1.5 block text-sm font-medium text-gray-700">
                Curriculum Standard *
              </label>
              <select
                id="curriculum_standard"
                className={`block w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.curriculum_standard ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                }`}
                {...register('curriculum_standard')}
              >
                <option value="">Select standard</option>
                <option value="IGCSE">IGCSE</option>
                <option value="IB">IB</option>
                <option value="Common Core">Common Core</option>
                <option value="A-Level">A-Level</option>
                <option value="AP">AP</option>
                <option value="CBSE">CBSE</option>
                <option value="National">National</option>
                <option value="Other">Other</option>
              </select>
              {errors.curriculum_standard && (
                <p className="mt-1 text-xs text-red-600">{errors.curriculum_standard.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="duration_weeks" className="mb-1.5 block text-sm font-medium text-gray-700">
                Duration (weeks)
              </label>
              <input
                id="duration_weeks"
                type="number"
                min={1}
                max={52}
                className={`block w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.duration_weeks ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                }`}
                {...register('duration_weeks')}
              />
              {errors.duration_weeks && <p className="mt-1 text-xs text-red-600">{errors.duration_weeks.message}</p>}
            </div>
          </div>

          {/* Learning Objectives */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Learning Objectives
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={objectiveInput}
                onChange={(e) => setObjectiveInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addObjective()
                  }
                }}
                placeholder="Type an objective and press Enter"
                className="block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="button"
                onClick={addObjective}
                className="btn-secondary shrink-0"
              >
                Add
              </button>
            </div>

            {/* Added objectives */}
            {objectives.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {objectives.map((obj, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700"
                  >
                    {obj}
                    <button
                      type="button"
                      onClick={() => removeObjective(index)}
                      className="ml-0.5 text-primary-400 hover:text-primary-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Suggested objectives */}
            {remainingSuggestions.length > 0 && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
                    <Lightbulb className="h-3.5 w-3.5" />
                    Suggested objectives for {watchSubject}
                  </div>
                  <button
                    type="button"
                    onClick={addAllSuggestions}
                    className="text-xs font-medium text-amber-700 underline hover:text-amber-900"
                  >
                    Add all
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {remainingSuggestions.map((obj, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => addSuggestedObjective(obj)}
                      className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-white px-2.5 py-1 text-xs text-amber-800 transition-colors hover:bg-amber-100"
                    >
                      <Plus className="h-3 w-3" />
                      {obj}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Additional Instructions */}
          <div>
            <label htmlFor="additional_instructions" className="mb-1.5 block text-sm font-medium text-gray-700">
              Additional Instructions
            </label>
            <textarea
              id="additional_instructions"
              rows={3}
              placeholder="e.g., Focus on practical applications, include project-based learning..."
              className="block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              {...register('additional_instructions')}
            />

            {/* Suggested instruction */}
            {suggestedInstruction && (
              <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-amber-700">
                  <Lightbulb className="h-3.5 w-3.5" />
                  Suggested instructions for {watchSubject}
                </div>
                <p className="text-xs text-amber-800">{suggestedInstruction}</p>
                <button
                  type="button"
                  onClick={applySuggestedInstruction}
                  className="mt-2 text-xs font-medium text-amber-700 underline hover:text-amber-900"
                >
                  Use this suggestion
                </button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary gap-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating with AI...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Syllabus
                </>
              )}
            </button>
            <Link href="/dashboard/syllabi" className="btn-secondary">
              Cancel
            </Link>
          </div>

          {isSubmitting && (
            <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
              AI is generating your syllabus. This may take a moment...
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
