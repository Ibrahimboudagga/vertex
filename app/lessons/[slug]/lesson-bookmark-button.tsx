'use client'

import {useState} from 'react'

import {Icon} from '../../components/design-system'
import {captureEvent} from '../../lib/posthog-client'

type LessonBookmarkButtonProps = {
  lessonId: string
  lessonSlug: string
}

export function LessonBookmarkButton({lessonId, lessonSlug}: LessonBookmarkButtonProps) {
  const [isSaved, setIsSaved] = useState(false)

  return <button aria-label={isSaved ? 'Remove lesson bookmark' : 'Bookmark lesson'} aria-pressed={isSaved} className={`lesson-bookmark${isSaved ? ' is-saved' : ''}`} onClick={() => {
    const nextSaved = !isSaved
    setIsSaved(nextSaved)
    captureEvent('lesson_bookmark_toggled', {bookmarked: nextSaved, lesson_id: lessonId, lesson_slug: lessonSlug})
  }} type="button"><Icon name="bookmark" filled={isSaved} /></button>
}
