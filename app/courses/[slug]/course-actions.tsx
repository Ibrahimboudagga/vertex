'use client'

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
  return <button
    className={`course-continue${location === 'footer' ? ' course-footer-continue' : ''}`}
    onClick={() => captureEvent('course_learning_continued', {
      course_id: courseId,
      course_slug: courseSlug,
      lesson_id: lessonId,
      lesson_slug: lessonSlug,
      location,
    })}
    type="button"
  >Continue Learning <Icon name="chevron" /></button>
}

export function BookmarkCourseButton({courseId, courseSlug}: CourseActionProps) {
  return <button
    className="course-bookmark"
    onClick={() => captureEvent('course_bookmarked', {
      course_id: courseId,
      course_slug: courseSlug,
    })}
    type="button"
  ><Icon name="bookmark" />Bookmark</button>
}
