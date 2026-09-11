'use client'

import {useRouter} from 'next/navigation'
import {useState} from 'react'

import {Icon} from '../../components/design-system'
import {captureEvent} from '../../lib/posthog-client'

type CourseActionProps = {
  courseId: string
  courseSlug: string
}

type ContinueLearningButtonProps = CourseActionProps & {
  lessonId: string
  lessonSlug: string
  location: 'hero' | 'footer'
}

export function ContinueLearningButton({courseId, courseSlug, lessonId, lessonSlug, location}: ContinueLearningButtonProps) {
  const router = useRouter()

  return <button
    className={`course-continue${location === 'footer' ? ' course-footer-continue' : ''}`}
    onClick={() => {
      captureEvent('course_learning_continued', {
        course_id: courseId,
        course_slug: courseSlug,
        lesson_id: lessonId,
        lesson_slug: lessonSlug,
        location,
      })
      router.push(`/lessons/${lessonSlug}`)
    }}
    type="button"
  >Continue Learning <Icon name="chevron" /></button>
}

export function BookmarkCourseButton({courseId, courseSlug}: CourseActionProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)

  return <button
    aria-label={isBookmarked ? 'Remove course bookmark' : 'Bookmark course'}
    aria-pressed={isBookmarked}
    className={`course-bookmark${isBookmarked ? ' is-bookmarked' : ''}`}
    onClick={() => {
      const nextBookmarked = !isBookmarked
      setIsBookmarked(nextBookmarked)
      captureEvent('course_bookmarked', {
        course_id: courseId,
        course_slug: courseSlug,
        bookmarked: nextBookmarked,
      })
    }}
    type="button"
  ><Icon name="bookmark" filled={isBookmarked} />{isBookmarked ? 'Bookmarked' : 'Bookmark'}</button>
}
