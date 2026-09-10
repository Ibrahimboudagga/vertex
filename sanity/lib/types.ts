import type {PortableTextBlock} from 'sanity'

type SanityImage = {
  asset?: {_ref: string; _type: 'reference'}
  hotspot?: unknown
  crop?: unknown
  alt?: string
}

export type SlugParam = {
  slug: string
}

export type CategoryListItem = {
  _id: string
  title: string
  slug: string
  description: string
  courseCount?: number
}

export type InstructorCard = {
  _id: string
  name: string
  slug: string
  expertise?: string[]
  photo?: SanityImage
}

export type Instructor = InstructorCard & {
  bio?: PortableTextBlock[]
  courses?: CourseListItem[]
}

export type LessonCard = {
  _id: string
  title: string
  slug: string
  duration: number
  freePreview?: boolean
  studentCount?: number
  thumbnail?: SanityImage
  keyPoints?: string[]
}

export type Lesson = LessonCard & {
  videoUrl: string
  notes?: PortableTextBlock[]
  proTip?: string
  resources?: Array<{
    _key: string
    type: 'article' | 'download' | 'repository' | 'tool' | 'reference'
    title: string
    description?: string
    url: string
  }>
  courseContext?: {
    _id: string
    title: string
    slug: string
    coverImage?: SanityImage
    instructor?: InstructorCard
    category?: CategoryListItem
    module?: {
      _key: string
      title: string
      summary?: string
      lessonIndex?: number
    }
  }
}

export type CourseModule = {
  _key: string
  title: string
  summary: string
  lessons?: LessonCard[]
}

export type CourseListItem = {
  _id: string
  title: string
  slug: string
  summary: string
  coverImage?: SanityImage
  level: 'beginner' | 'intermediate' | 'advanced'
  price: number
  isPopular?: boolean
  studentCount?: number
  instructor?: InstructorCard
  category?: CategoryListItem
  moduleCount?: number
  lessonCount?: number
  durationSeconds?: number
}

export type Course = CourseListItem & {
  outcomes?: Array<{
    _key: string
    icon: string
    title: string
    description: string
  }>
  modules?: CourseModule[]
}

export type CourseSlug = SlugParam
export type LessonSlug = SlugParam
export type InstructorSlug = SlugParam
