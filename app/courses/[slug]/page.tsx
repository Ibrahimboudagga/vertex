import {SignInButton, SignUpButton, Show, UserButton} from '@clerk/nextjs'
import Image from 'next/image'
import Link from 'next/link'
import {notFound} from 'next/navigation'

import {Icon} from '../../components/design-system'
import {BookmarkCourseButton, ContinueLearningButton} from './course-actions'
import {CourseModules} from '../components/course-modules'
import {getAllCourseSlugs, getCourseBySlug} from '../../../sanity/lib/data'
import {urlFor} from '../../../sanity/lib/image'
import type {Course, CourseModule} from '../../../sanity/lib/types'

type CoursePageProps = {
  params: Promise<{slug: string}>
}

const outcomeIcons = ['target', 'chart', 'clock', 'star'] as const

export async function generateStaticParams() {
  return getAllCourseSlugs()
}

export default async function CoursePage({params}: CoursePageProps) {
  const {slug} = await params
  const course = await getCourseBySlug(slug)

  if (!course) notFound()

  const modules = course.modules ?? []
  const durationSeconds = modules.reduce((total, module) => total + getModuleDuration(module), 0)
  const firstLesson = modules.flatMap((module) => module.lessons ?? [])[0]
  const outcomes = getOutcomes(course)
  const coverImageUrl = course.coverImage?.asset
    ? urlFor(course.coverImage).width(560).height(560).fit('crop').url()
    : null

  return (
    <main className="course-page">
      <div className="site-shell course-shell">
        <header className="site-header">
          <Link className="home-brand" href="/" aria-label="Vertex home">
            <span className="brand-mark"><Icon name="vertex" /></span><span>Vertex</span>
          </Link>
          <nav className="main-nav" aria-label="Main navigation">
            <Link className="nav-active" href="/">Courses</Link>
            <a href="#course-content">My Learning</a>
          </nav>
          <div className="header-actions">
            <button className="icon-button" type="button" aria-label="Notifications"><Icon name="bell" /></button>
            <Show when="signed-out">
              <SignInButton mode="modal"><button className="auth-link" type="button">Sign in</button></SignInButton>
              <SignUpButton mode="modal"><button className="auth-button" type="button">Sign up</button></SignUpButton>
            </Show>
            <Show when="signed-in"><div className="user-button-wrap"><UserButton /></div></Show>
          </div>
        </header>

        <div className="course-body">
          <nav className="course-crumbs" aria-label="Breadcrumb">
            <Link href="/">All Courses</Link><Icon name="chevron" /><span>{course.title}</span>
          </nav>

          <section className="course-hero" aria-labelledby="course-title">
            <div className="course-cover" aria-label={`${course.title} course cover`}>
              {coverImageUrl ? <Image src={coverImageUrl} alt={course.coverImage?.alt ?? ''} width={560} height={560} priority /> : <span aria-hidden="true">N</span>}
            </div>
            <div className="course-intro">
              {course.isPopular && <span className="course-popular">Popular</span>}
              <h1 id="course-title">{course.title}</h1>
              <p>{course.summary}</p>
              <div className="course-hero-meta" aria-label="Course details">
                <span><Icon name="chart" />{capitalize(course.level)}</span>
                <span><Icon name="clock" />{formatDuration(durationSeconds)}</span>
                <span><Icon name="file" />{modules.length} modules</span>
                {course.studentCount ? <span><Icon name="user" />{formatStudentCount(course.studentCount)} students</span> : null}
              </div>
              <div className="course-hero-actions">
                {firstLesson ? <ContinueLearningButton courseId={course._id} courseSlug={course.slug} lessonId={firstLesson._id} lessonSlug={firstLesson.slug} location="hero" /> : null}
                <BookmarkCourseButton courseId={course._id} courseSlug={course.slug} />
              </div>
            </div>
          </section>

          {outcomes.length ? <section className="outcomes-panel" aria-labelledby="outcomes-title">
            <h2 id="outcomes-title">What you’ll learn</h2>
            <div className="outcomes-grid">
              {outcomes.map((outcome, index) => <article className="outcome-card" key={outcome._key}>
                <Icon name={outcomeIcons[index % outcomeIcons.length]} />
                <div><h3>{outcome.title}</h3><p>{outcome.description}</p></div>
              </article>)}
            </div>
          </section> : null}

          <section className="course-content" id="course-content" aria-labelledby="course-content-title">
            <div className="course-content-heading">
              <h2 id="course-content-title">Course Content</h2>
              <span>{modules.length} modules <i>•</i> {formatDuration(durationSeconds)}</span>
            </div>
            <CourseModules courseId={course._id} courseSlug={course.slug} modules={modules} />
          </section>
        </div>

        <footer className="course-progress-bar">
          <div className="progress-copy"><span>Your Progress</span><strong>0% complete</strong></div>
          <div className="progress-track" aria-label="0 percent complete"><i /></div>
          {firstLesson ? <ContinueLearningButton courseId={course._id} courseSlug={course.slug} lessonId={firstLesson._id} lessonSlug={firstLesson.slug} location="footer" /> : null}
        </footer>
      </div>
    </main>
  )
}

function getModuleDuration(module: CourseModule) {
  return (module.lessons ?? []).reduce((total, lesson) => total + (Number(lesson.duration) || 0), 0)
}

function getOutcomes(course: Course) {
  if (course.outcomes?.length) return course.outcomes
  return (course.modules ?? []).slice(0, 4).map((module, index) => ({
    _key: module._key,
    icon: outcomeIcons[index % outcomeIcons.length],
    title: module.title,
    description: module.summary,
  }))
}

function formatDuration(seconds: number) {
  const minutes = Math.max(0, Math.round(seconds / 60))
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return hours ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`
}

function formatStudentCount(count: number) {
  return count >= 1000 ? `${(count / 1000).toFixed(1).replace('.0', '')}k` : count.toLocaleString('en-US')
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
