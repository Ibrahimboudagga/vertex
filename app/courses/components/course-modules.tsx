'use client'

import Link from 'next/link'
import {useState} from 'react'

import {Icon} from '../../components/design-system'
import {captureEvent} from '../../lib/posthog-client'
import type {CourseModule} from '../../../sanity/lib/types'

type CourseModulesProps = {
  courseId: string
  courseSlug: string
  modules: CourseModule[]
}

export function CourseModules({courseId, courseSlug, modules}: CourseModulesProps) {
  const [openModuleKey, setOpenModuleKey] = useState<string | null>(null)

  const handleModuleToggle = (moduleKey: string, moduleIndex: number, isOpen: boolean, lessonCount: number) => {
    captureEvent('course_module_toggled', {
      course_id: courseId,
      course_slug: courseSlug,
      module_key: moduleKey,
      module_index: moduleIndex,
      is_open: !isOpen,
      lesson_count: lessonCount,
    })
    setOpenModuleKey(isOpen ? null : moduleKey)
  }

  return <div className="module-list">
    {modules.map((module, moduleIndex) => {
      const isOpen = openModuleKey === module._key
      const lessons = module.lessons ?? []
      const panelId = `module-${module._key}`

      return <div className="module-accordion-item" key={module._key}>
        <button
          aria-controls={panelId}
          aria-expanded={isOpen}
          className={`module-row${isOpen ? ' is-open' : ''}`}
          onClick={() => handleModuleToggle(module._key, moduleIndex, isOpen, lessons.length)}
          type="button"
        >
          <span className="module-number">{moduleIndex + 1}</span>
          <span className="module-copy"><span className="module-title">{module.title}</span><span>{module.summary || `${lessons.length} lessons in this module.`}</span></span>
          <span className="module-duration">{formatDuration(getModuleDuration(module))}</span>
          <Icon name="chevron" />
        </button>
        {isOpen ? <div className="module-lessons" id={panelId}>
          {lessons.map((lesson, lessonIndex) => <Link
            className="module-lesson"
            href={`/lessons/${lesson.slug}`}
            key={lesson._id}
            onClick={() => captureEvent('lesson_selected', {
              course_id: courseId,
              course_slug: courseSlug,
              lesson_id: lesson._id,
              lesson_slug: lesson.slug,
              module_key: module._key,
              module_index: moduleIndex,
              lesson_index: lessonIndex,
              free_preview: Boolean(lesson.freePreview),
            })}
          >
            <span className="module-lesson-number">{moduleIndex + 1}.{lessonIndex + 1}</span>
            <span className="module-lesson-title">{lesson.title}{lesson.freePreview ? <em>Free preview</em> : null}</span>
            <span>{formatDuration(lesson.duration)}</span>
            <Icon name="chevron" />
          </Link>)}
        </div> : null}
      </div>
    })}
  </div>
}

function getModuleDuration(module: CourseModule) {
  return (module.lessons ?? []).reduce((total, lesson) => total + (Number(lesson.duration) || 0), 0)
}

function formatDuration(seconds: number) {
  const minutes = Math.max(0, Math.round(seconds / 60))
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return hours ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`
}
