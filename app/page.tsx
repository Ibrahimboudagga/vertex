import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import Image from "next/image";
import { Icon } from "./components/design-system";
import Link from "next/link";
import { getAllCourses } from "../sanity/lib/data";
import { urlFor } from "../sanity/lib/image";
import type { CourseListItem } from "../sanity/lib/types";

export default async function Home() {
  const courses = (await getAllCourses()).slice(0, 3);

  return (
    <main className="home-page">
      <div className="site-shell">
        <header className="site-header">
          <Link className="home-brand" href="/" aria-label="Vertex home"><span className="brand-mark"><Icon name="vertex" /></span><span>Vertex</span></Link>
          <nav className="main-nav" aria-label="Main navigation"><Link className="nav-active" href="/courses">Courses</Link><a href="#learning">My Learning</a></nav>
          <div className="header-actions">
            <button className="icon-button" type="button" aria-label="Notifications"><Icon name="bell" /></button>
            <Show when="signed-out">
              <SignInButton mode="modal"><button className="auth-link" type="button">Sign in</button></SignInButton>
              <SignUpButton mode="modal"><button className="auth-button" type="button">Sign up</button></SignUpButton>
            </Show>
            <Show when="signed-in">
              <div className="user-button-wrap"><UserButton /></div>
            </Show>
          </div>
        </header>

        <section className="hero" aria-labelledby="hero-title">
          <span className="eyebrow">Intelligent learning</span>
          <h1 id="hero-title">Search your learning<br />in plain English.</h1>
          <p>Vertex understands what you want to learn and<br className="desktop-only" /> finds the exact lessons across all your courses.</p>
          <Link className="button" href="/courses">Explore Courses <Icon name="chevron" /></Link>
          <label className="hero-search"><Icon name="search" /><input aria-label="Search anything about your learning" placeholder="Ask anything about your learning..." /><kbd>⌘ K</kbd></label>
        </section>

        <section className="courses-section" id="courses" aria-labelledby="courses-title">
          <div className="section-top"><h2 id="courses-title">All Courses</h2><Link href="/courses">View all courses <Icon name="chevron" /></Link></div>
          <div className="course-grid">{courses.map((course) => <CourseCard key={course._id} course={course} />)}</div>
          <div className="weekly-callout"><span className="callout-line" /><Icon name="star" /><span>New courses and lessons added every week.</span><span className="callout-line" /></div>
          <div className="course-bars" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
        </section>
      </div>
    </main>
  );
}

function CourseCard({ course }: { course: CourseListItem }) {
  const imageUrl = course.coverImage?.asset
    ? urlFor(course.coverImage).width(176).height(176).fit("crop").url()
    : null;

  return <Link className="home-course-card-link" href={`/courses/${course.slug}`} aria-label={`Open ${course.title}`}>
    <article className="course-card">
      <div className="course-logo">{imageUrl ? <Image src={imageUrl} alt={course.coverImage?.alt ?? ""} width={176} height={176} /> : getInitials(course.title)}</div>
      <h3>{course.title}</h3><p>{course.summary}</p>
      <div className="course-meta"><span><Icon name="chart" />{capitalize(course.level)}</span><span><Icon name="clock" />{formatDuration(course.durationSeconds)}</span><span><Icon name="file" />{course.moduleCount ?? 0} modules</span></div>
    </article>
  </Link>;
}

function formatDuration(seconds = 0) {
  const minutes = Math.max(0, Math.round(seconds / 60));
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return hours ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`;
}

function getInitials(title: string) {
  return title.split(/\s+/).slice(0, 2).map((word) => word.charAt(0)).join("").toUpperCase();
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
