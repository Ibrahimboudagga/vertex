'use client'

import type {ReactNode} from 'react'

import {captureEvent} from '../../lib/posthog-client'

type LessonResourceLinkProps = {
  children: ReactNode
  href: string
  lessonId: string
  lessonSlug: string
  resourceIndex: number
  resourceType: string
}

export function LessonResourceLink({children, href, lessonId, lessonSlug, resourceIndex, resourceType}: LessonResourceLinkProps) {
  return <a
    href={href}
    onClick={() => captureEvent('lesson_resource_opened', {
      lesson_id: lessonId,
      lesson_slug: lessonSlug,
      resource_index: resourceIndex,
      resource_type: resourceType,
    })}
    rel="noreferrer"
    target="_blank"
  >{children}</a>
}
