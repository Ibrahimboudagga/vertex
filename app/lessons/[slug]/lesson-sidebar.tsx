'use client'

import Image from 'next/image'
import Link from 'next/link'
import {useState} from 'react'

import {Icon} from '../../components/design-system'
import {captureEvent} from '../../lib/posthog-client'
import type {CourseModule} from '../../../sanity/lib/types'

type LessonSidebarProps = {
  activeLessonId: string
  courseId: string
  courseSlug: string
  courseTitle: string
  coverAlt: string
  coverUrl: string | null
  modules: CourseModule[]
}

export function LessonSidebar({activeLessonId, courseId, courseSlug, courseTitle, coverAlt, coverUrl, modules}: LessonSidebarProps) {
  const activeModule = modules.find((module) => module.lessons?.some((lesson) => lesson._id === activeLessonId))
  const [openModuleKey, setOpenModuleKey] = useState<string | null>(activeModule?._key ?? modules[0]?._key ?? null)

  return <aside className="lesson-sidebar" aria-label={`${courseTitle} lessons`}>
    <Link className="lesson-back-link" href={`/courses/${courseSlug}`}><Icon name="chevron-left" />Back to course</Link>

    <div className="lesson-course-summary">
      <div className="lesson-course-cover">
        {coverUrl ? <Image alt={coverAlt} height={66} src={coverUrl} width={66} /> : <span aria-hidden="true">N</span>}
      </div>
      <div><strong>{courseTitle}</strong><span>Course content</span></div>
    </div>

    <div className="lesson-sidebar-modules">
      {modules.map((module, moduleIndex) => {
        const isOpen = module._key === openModuleKey
        const panelId = `lesson-sidebar-module-${module._key}`
        const lessons = module.lessons ?? []

        return <section className={`lesson-sidebar-module${isOpen ? ' is-open' : ''}`} key={module._key}>
          <button aria-controls={panelId} aria-expanded={isOpen} className="lesson-sidebar-module-toggle" onClick={() => setOpenModuleKey(isOpen ? null : module._key)} type="button">
            <span className="lesson-sidebar-module-number">{moduleIndex + 1}</span>
            <span><strong>{module.title}</strong><small>{formatDuration(getModuleDuration(module))}</small></span>
            <Icon name="chevron" />
          </button>
          {isOpen ? <div className="lesson-sidebar-lessons" id={panelId}>
            {lessons.map((lesson, lessonIndex) => {
              const isActive = lesson._id === activeLessonId
              return <Link aria-current={isActive ? 'page' : undefined} className={`lesson-sidebar-lesson${isActive ? ' is-active' : ''}`} href={`/lessons/${lesson.slug}`} key={lesson._id} onClick={() => captureEvent('lesson_selected', {
                course_id: courseId,
                course_slug: courseSlug,
                lesson_id: lesson._id,
                lesson_slug: lesson.slug,
                module_key: module._key,
                module_index: moduleIndex,
                lesson_index: lessonIndex,
                source: 'lesson_sidebar',
              })}>
                <span className="lesson-sidebar-lesson-dot">{isActive ? <Icon name="play" filled /> : null}</span>
                <span><strong>{lesson.title}</strong><small>{isActive ? 'Now playing' : formatDuration(lesson.duration)}</small></span>
                <span className="sr-only">Lesson {moduleIndex + 1}.{lessonIndex + 1}</span>
              </Link>
            })}
          </div> : null}
        </section>
      })}
    </div>
  </aside>
}

function getModuleDuration(module: CourseModule) {
  return (module.lessons ?? []).reduce((total, lesson) => total + lesson.duration, 0)
}

function formatDuration(seconds: number) {
  const minutes = Math.max(0, Math.round(seconds / 60))
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return hours ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`
}
