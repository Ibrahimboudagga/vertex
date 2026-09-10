'use client'

import {useState} from 'react'

import {Icon} from '../../components/design-system'

export function LessonBookmarkButton() {
  const [isSaved, setIsSaved] = useState(false)

  return <button aria-label={isSaved ? 'Remove lesson bookmark' : 'Bookmark lesson'} aria-pressed={isSaved} className={`lesson-bookmark${isSaved ? ' is-saved' : ''}`} onClick={() => setIsSaved((saved) => !saved)} type="button"><Icon name="bookmark" filled={isSaved} /></button>
}
