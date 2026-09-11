import {SignInButton, SignUpButton, Show, UserButton} from '@clerk/nextjs'
import Link from 'next/link'
import {notFound} from 'next/navigation'
import type {PortableTextBlock} from 'sanity'

import {Icon} from '../../components/design-system'
import {LessonBookmarkButton} from './lesson-bookmark-button'
import {LessonContentTabs} from './lesson-content-tabs'
import {LessonResourceLink} from './lesson-resource-link'
import {LessonSidebar} from './lesson-sidebar'
import {LessonVideo} from './lesson-video'
import {getAllLessonSlugs, getLessonBySlug} from '../../../sanity/lib/data'
import {urlFor} from '../../../sanity/lib/image'
import type {CourseModule, LessonCard} from '../../../sanity/lib/types'

type LessonPageProps = {
  params: Promise<{slug: string}>
  searchParams: Promise<{start?: string | string[]}>
}

export async function generateStaticParams() {
  return getAllLessonSlugs()
}

export default async function LessonPage({params, searchParams}: LessonPageProps) {
  const [{slug}, query] = await Promise.all([params, searchParams])
  const lesson = await getLessonBySlug(slug)

  if (!lesson) notFound()

  const startSeconds = getStartSeconds(query.start)
  const embedUrl = getYouTubeEmbedUrl(lesson.videoUrl, startSeconds)
  const course = lesson.courseContext
  const modules = course?.modules ?? []
  const {courseModule, moduleIndex, lessonIndex} = findLessonLocation(modules, lesson._id)
  const allLessons = modules.flatMap((courseModule) => courseModule.lessons ?? [])
  const activeLessonIndex = allLessons.findIndex((candidate) => candidate._id === lesson._id)
  const previousLesson = activeLessonIndex > 0 ? allLessons[activeLessonIndex - 1] : null
  const nextLesson = activeLessonIndex >= 0 && activeLessonIndex < allLessons.length - 1 ? allLessons[activeLessonIndex + 1] : null
  const coverUrl = course?.coverImage?.asset ? urlFor(course.coverImage).width(132).height(132).fit('crop').url() : null
  const lessonLabel = moduleIndex >= 0 && lessonIndex >= 0 ? `Lesson ${moduleIndex + 1}.${lessonIndex + 1}` : 'Lesson'
  const overview = getFirstParagraph(lesson.notes)

  return <main className="lesson-page">
    <div className="site-shell lesson-shell">
      <header className="site-header">
        <Link className="home-brand" href="/" aria-label="Vertex home"><span className="brand-mark"><Icon name="vertex" /></span><span>Vertex</span></Link>
        <nav className="main-nav" aria-label="Main navigation"><Link className="nav-active" href="/courses">Courses</Link><a href="#lesson-content">My Learning</a></nav>
        <div className="header-actions">
          <button className="icon-button" type="button" aria-label="Notifications"><Icon name="bell" /></button>
          <Show when="signed-out">
            <SignInButton mode="modal"><button className="auth-link" type="button">Sign in</button></SignInButton>
            <SignUpButton mode="modal"><button className="auth-button" type="button">Sign up</button></SignUpButton>
          </Show>
          <Show when="signed-in"><div className="user-button-wrap"><UserButton /></div></Show>
        </div>
      </header>

      <div className="lesson-layout">
        {course ? <LessonSidebar activeLessonId={lesson._id} courseId={course._id} courseSlug={course.slug} courseTitle={course.title} coverAlt={course.coverImage?.alt ?? `${course.title} course cover`} coverUrl={coverUrl} modules={modules} /> : null}

        <div className="lesson-main" id="lesson-content">
          <nav className="course-crumbs" aria-label="Breadcrumb">
            <Link href="/courses">All Courses</Link><Icon name="chevron" />
            {course ? <><Link href={`/courses/${course.slug}`}>{course.title}</Link><Icon name="chevron" /></> : null}
            {courseModule ? <><span>{courseModule.title}</span><Icon name="chevron" /></> : null}
            <span>{lesson.title}</span>
          </nav>

          <section className="lesson-heading" aria-labelledby="lesson-title">
            <div className="lesson-heading-top"><span>{lessonLabel}</span><LessonBookmarkButton lessonId={lesson._id} lessonSlug={lesson.slug} /></div>
            <h1 id="lesson-title">{lesson.title}</h1>
            {overview ? <p className="lesson-summary">{overview}</p> : null}
            <div className="lesson-meta" aria-label="Lesson details">
              <span><Icon name="clock" />{formatDuration(lesson.duration)}</span>
              {course?.level ? <span><Icon name="chart" />{capitalize(course.level)}</span> : null}
              {lesson.studentCount ? <span><Icon name="user" />{formatStudentCount(lesson.studentCount)} students</span> : null}
            </div>
          </section>

          {embedUrl ? <LessonVideo courseId={course?._id} courseSlug={course?.slug} embedUrl={embedUrl} lessonId={lesson._id} lessonSlug={lesson.slug} startSeconds={startSeconds} title={lesson.title} /> : <section className="video-unavailable"><Icon name="play" /><h2>Video player unavailable</h2><p>This lesson’s video provider is not supported by the current player.</p></section>}

          <LessonContentTabs keyPoints={lesson.keyPoints ?? []} lessonId={lesson._id} lessonSlug={lesson.slug} notes={lesson.notes} overview={overview} proTip={lesson.proTip} />

          {lesson.resources?.length ? <section className="lesson-resources" aria-labelledby="lesson-resources-title">
            <h2 id="lesson-resources-title">Resources</h2>
            <div className="lesson-resource-grid">
              {lesson.resources.map((resource, resourceIndex) => <LessonResourceLink href={resource.url} key={resource._key} lessonId={lesson._id} lessonSlug={lesson.slug} resourceIndex={resourceIndex} resourceType={resource.type}><Icon name="file" /><span><strong>{resource.title}</strong>{resource.description ? <small>{resource.description}</small> : null}</span><Icon name="external" /></LessonResourceLink>)}
            </div>
          </section> : null}
        </div>
      </div>

      <footer className="lesson-pagination" aria-label="Lesson navigation">
        {previousLesson ? <LessonNavigationLink direction="previous" lesson={previousLesson} /> : <span />}
        {nextLesson ? <LessonNavigationLink direction="next" lesson={nextLesson} /> : <span />}
      </footer>
    </div>
  </main>
}

function LessonNavigationLink({direction, lesson}: {direction: 'previous' | 'next'; lesson: LessonCard}) {
  const isPrevious = direction === 'previous'
  return <Link className={`lesson-pagination-link lesson-pagination-${direction}`} href={`/lessons/${lesson.slug}`}>
    <Icon name={isPrevious ? 'chevron-left' : 'chevron'} />
    <span><small>{isPrevious ? 'Previous Lesson' : 'Next Lesson'}</small><strong>{lesson.title}</strong><em>{formatDuration(lesson.duration)}</em></span>
  </Link>
}

function findLessonLocation(modules: CourseModule[], lessonId: string) {
  const moduleIndex = modules.findIndex((courseModule) => courseModule.lessons?.some((candidate) => candidate._id === lessonId))
  const courseModule = moduleIndex >= 0 ? modules[moduleIndex] : undefined
  const lessonIndex = courseModule?.lessons?.findIndex((candidate) => candidate._id === lessonId) ?? -1
  return {courseModule, moduleIndex, lessonIndex}
}

function getFirstParagraph(notes?: PortableTextBlock[]) {
  const block = notes?.find((candidate) => candidate._type === 'block' && candidate.style === 'normal')
  if (!block || !('children' in block) || !Array.isArray(block.children)) return undefined
  const text = block.children.map((child) => 'text' in child ? child.text : '').join('').trim()
  return text || undefined
}

function getStartSeconds(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value
  if (!rawValue || !/^\d+$/.test(rawValue)) return 0
  const parsed = Number(rawValue)
  return Number.isSafeInteger(parsed) ? parsed : 0
}

function getYouTubeEmbedUrl(source: string, startSeconds: number) {
  try {
    const url = new URL(source)
    const hostname = url.hostname.replace('www.', '')
    const id = hostname === 'youtu.be'
      ? url.pathname.split('/').filter(Boolean)[0]
      : hostname === 'youtube.com' || hostname === 'm.youtube.com'
        ? url.searchParams.get('v') ?? url.pathname.split('/embed/')[1]?.split('/')[0]
        : null

    if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) return null
    const parameters = new URLSearchParams({enablejsapi: '1', rel: '0'})
    if (startSeconds > 0) parameters.set('start', String(startSeconds))
    return `https://www.youtube-nocookie.com/embed/${id}?${parameters}`
  } catch {
    return null
  }
}

function formatDuration(seconds: number) {
  const minutes = Math.max(0, Math.round(seconds / 60))
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return hours ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`
}

function formatStudentCount(count: number) {
  return count >= 1000 ? count.toLocaleString('en-US') : String(count)
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
