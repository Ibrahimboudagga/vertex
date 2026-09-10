import {SignInButton, SignUpButton, Show, UserButton} from '@clerk/nextjs'
import Image from 'next/image'
import Link from 'next/link'

import {Icon} from '../components/design-system'
import {getAllCourses} from '../../sanity/lib/data'
import {urlFor} from '../../sanity/lib/image'
import type {CourseListItem} from '../../sanity/lib/types'

export default async function CoursesPage() {
  const courses = await getAllCourses()

  return <main className="catalog-page">
    <div className="site-shell catalog-shell">
      <header className="site-header">
        <Link className="home-brand" href="/" aria-label="Vertex home"><span className="brand-mark"><Icon name="vertex" /></span><span>Vertex</span></Link>
        <nav className="main-nav" aria-label="Main navigation"><Link className="nav-active" href="/courses">Courses</Link><a href="#learning">My Learning</a></nav>
        <div className="header-actions">
          <button className="icon-button" type="button" aria-label="Notifications"><Icon name="bell" /></button>
          <Show when="signed-out">
            <SignInButton mode="modal"><button className="auth-link" type="button">Sign in</button></SignInButton>
            <SignUpButton mode="modal"><button className="auth-button" type="button">Sign up</button></SignUpButton>
          </Show>
          <Show when="signed-in"><div className="user-button-wrap"><UserButton /></div></Show>
        </div>
      </header>

      <section className="catalog-content" aria-labelledby="catalog-title">
        <h1 className="sr-only" id="catalog-title">All courses</h1>
        <div className="catalog-grid">
          {courses.map((course) => <CourseCatalogCard course={course} key={course._id} />)}
        </div>
      </section>
    </div>
  </main>
}

function CourseCatalogCard({course}: {course: CourseListItem}) {
  const imageUrl = course.coverImage?.asset
    ? urlFor(course.coverImage).width(220).height(220).fit('crop').url()
    : null

  return <Link className="catalog-card-link" href={`/courses/${course.slug}`} aria-label={`Open ${course.title}`}>
    <article className="catalog-card">
      <div className="catalog-card-art">
        {imageUrl ? <Image src={imageUrl} alt={course.coverImage?.alt ?? ''} width={220} height={220} /> : <span aria-hidden="true">{getInitials(course.title)}</span>}
      </div>
      <h2>{course.title}</h2>
      <p>{course.summary}</p>
      <div className="catalog-card-meta">
        <span><Icon name="chart" />{capitalize(course.level)}</span>
        <span><Icon name="clock" />{formatDuration(course.durationSeconds)}</span>
        <span><Icon name="file" />{course.moduleCount ?? 0} modules</span>
      </div>
    </article>
  </Link>
}

function formatDuration(seconds = 0) {
  const minutes = Math.max(0, Math.round(seconds / 60))
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return hours ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`
}

function getInitials(title: string) {
  return title.split(/\s+/).slice(0, 2).map((word) => word.charAt(0)).join('').toUpperCase()
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
