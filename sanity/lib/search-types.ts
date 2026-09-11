export type SearchCourse = {
  id: string
  title: string
  slug: string
  coverImageUrl?: string
}

type SearchResultBase = {
  id: string
  course: SearchCourse
  moduleTitle: string
  moduleNumber: number
  lessonNumber: number
  lessonTitle: string
  lessonSlug: string
  thumbnailUrl?: string
  description: string
  relevance: number
}

export type LessonSearchResult = SearchResultBase & {
  kind: 'lesson'
  keyPoints: string[]
}

export type VideoSearchResult = SearchResultBase & {
  kind: 'video'
  startSeconds: number
  timestampLabel: string
  matchLabel: string
}

export type SearchResult = LessonSearchResult | VideoSearchResult

export type SearchResponse = {
  query: string
  resultCount: number
  courseCount: number
  results: SearchResult[]
}
