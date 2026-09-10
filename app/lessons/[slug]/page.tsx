import {SignInButton, SignUpButton, Show, UserButton} from '@clerk/nextjs'
import Link from 'next/link'
import {notFound} from 'next/navigation'

import {Icon} from '../../components/design-system'
import {LessonResourceLink} from './lesson-resource-link'
import {getAllLessonSlugs, getLessonBySlug} from '../../../sanity/lib/data'

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

      <div className="lesson-body" id="lesson-content">
        <nav className="course-crumbs" aria-label="Breadcrumb">
          <Link href="/courses">All Courses</Link><Icon name="chevron" />
          {course ? <><Link href={`/courses/${course.slug}`}>{course.title}</Link><Icon name="chevron" /></> : null}
          <span>{lesson.title}</span>
        </nav>

        <section className="lesson-heading" aria-labelledby="lesson-title">
          {course?.module ? <span>{course.module.title}</span> : null}
          <h1 id="lesson-title">{lesson.title}</h1>
          <p><Icon name="clock" />{formatDuration(lesson.duration)}{course?.instructor ? <><i>•</i>{course.instructor.name}</> : null}</p>
        </section>

        {embedUrl ? <div className="lesson-video"><iframe allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen src={embedUrl} title={`${lesson.title} video`} /></div> : <section className="video-unavailable"><Icon name="play" /><h2>Video player unavailable</h2><p>This lesson’s video provider is not supported by the current player.</p></section>}

        <section className="lesson-details">
          <div>
            <h2>In this lesson</h2>
            <ul>{(lesson.keyPoints ?? []).map((point) => <li key={point}>{point}</li>)}</ul>
            {lesson.proTip ? <aside className="lesson-pro-tip"><strong>Pro tip</strong><p>{lesson.proTip}</p></aside> : null}
          </div>
          {lesson.resources?.length ? <div className="lesson-resources"><h2>Resources</h2>{lesson.resources.map((resource, resourceIndex) => <LessonResourceLink href={resource.url} key={resource._key} lessonId={lesson._id} lessonSlug={lesson.slug} resourceIndex={resourceIndex} resourceType={resource.type}><Icon name="external" /><span><strong>{resource.title}</strong>{resource.description ? <small>{resource.description}</small> : null}</span></LessonResourceLink>)}</div> : null}
        </section>
      </div>
    </div>
  </main>
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
    const params = new URLSearchParams({rel: '0'})
    if (startSeconds > 0) params.set('start', String(startSeconds))
    return `https://www.youtube-nocookie.com/embed/${id}?${params}`
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
