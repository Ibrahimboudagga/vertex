export const analyticsEvents = [
  'course_bookmarked',
  'course_learning_continued',
  'course_module_toggled',
  'lesson_bookmark_toggled',
  'lesson_completed',
  'lesson_resource_opened',
  'lesson_resume_used',
  'lesson_selected',
  'lesson_tab_selected',
  'lesson_video_played',
  'lesson_video_watch_depth_reached',
  'search_execution_completed',
  'search_execution_failed',
  'search_performed',
  'search_result_opened',
  'search_sort_changed',
] as const

export type AnalyticsEventName = (typeof analyticsEvents)[number]
export type AnalyticsProperties = Record<string, boolean | number | string | undefined>

type SearchQueryAnalyticsProperties = {
  query?: string
  query_length: number
  query_redacted: boolean
  query_word_count: number
}

const emailPattern = /\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/i
const phonePattern = /(?:\+?\d[\d().\s-]{6,}\d)/
const longIdentifierPattern = /\b\d{9,}\b/

export function getSafeSearchQueryProperties(query: string): SearchQueryAnalyticsProperties {
  const normalizedQuery = query.trim().replace(/\s+/g, ' ').toLowerCase()
  const baseProperties = {
    query_length: normalizedQuery.length,
    query_word_count: normalizedQuery ? normalizedQuery.split(' ').length : 0,
  }

  if (emailPattern.test(normalizedQuery) || phonePattern.test(normalizedQuery) || longIdentifierPattern.test(normalizedQuery)) {
    return {...baseProperties, query_redacted: true}
  }

  return {...baseProperties, query: normalizedQuery, query_redacted: false}
}
